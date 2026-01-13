import {
    loginFailure,
    loginSuccess,
    registerSuccess,
    socketConnected,
    socketDisconnected,
    socketConnectionError
} from "../store/slices/authSlice";
import {addMessage, ChatMessage, clearMessages, setMessages} from "../store/slices/chatSlice";
import {store} from "../store/store";
import {ChatPartner, setPartners, updatePartnerOnline} from "../store/slices/chatPartnerSlice";
import {increaseUnread} from "../store/slices/unreadSlice";

const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const HEARTBEAT_INTERVAL = 30000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;


const CHAT_WHITELIST = [
    '22130302', 'trunghan', 'anhtuan12', 'hantr', 'long'
];

class SocketService {
    private socket: WebSocket | null = null;
    private connectionReady: Promise<void> | null = null;
    private resolveConnection: (() => void) | null = null;
    private rejectConnection: ((error: Error) => void) | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private shouldReconnect: boolean = true;
    private reconnectAttempts: number = 0;
    private checkOnlineQueue: string[] = [];

    connect(): Promise<void> {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }
        if (this.connectionReady) return this.connectionReady;

        this.connectionReady = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;
            this.rejectConnection = reject;
        });

        this.socket = new WebSocket(SOCKET_URL);

        this.socket.onopen = () => {
            this.reconnectAttempts = 0;
            store.dispatch(socketConnected());
            this.startHeartbeat();
            if (this.resolveConnection) this.resolveConnection();
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerResponse(data);
        };

        this.socket.onerror = (error) => {
            console.error('Lỗi socket:', error);
            store.dispatch(socketConnectionError('Lỗi kết nối.'));
            if (this.rejectConnection) this.rejectConnection(new Error('Lỗi kết nối.'));
        };

        this.socket.onclose = (event) => {
            console.log('Đóng kết nối:', event.code);
            this.stopHeartbeat();
            store.dispatch(socketDisconnected());
            this.connectionReady = null;

            if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                this.reconnectAttempts++;
                setTimeout(() => this.attemptReconnect(), RECONNECT_DELAY);
            } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                store.dispatch(socketConnectionError('Không thể kết nối lại.'));
            }
        };

        return this.connectionReady;
    }

    private handleServerResponse(receivedData: any) {
        const payload = receivedData.action === 'onchat' ? receivedData.data : receivedData;
        const {event, status, data: responseData} = payload;

        // Lấy thông tin chat hiện tại từ Redux store để so sánh
        const currentChatState = store.getState().currentChat;
        const myUsername = store.getState().auth.user?.username || localStorage.getItem('username');

        if (status === 'success') {
            switch (event) {
                case 'LOGIN':
                case 'RE_LOGIN':
                    const reLoginCode = responseData?.RE_LOGIN_CODE;
                    store.dispatch(loginSuccess({
                        user: {username: myUsername || ''},
                        reLoginCode: reLoginCode,
                    }));
                    this.getUserList();
                    break;

                case 'REGISTER':
                    store.dispatch(registerSuccess());
                    store.dispatch(loginSuccess({
                        user: {username: myUsername || ''},
                        reLoginCode: responseData?.RE_LOGIN_CODE,
                    }));
                    this.getUserList();
                    break;

                case 'GET_PEOPLE_CHAT_MES':
                    // Case này hơi khó vì nếu mảng rỗng thì không biết ai là partner để set
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const lastMsg = responseData[0];

                        // Logic xác định mình đang chat với ai
                        const partnerName = lastMsg.name === myUsername ? lastMsg.to : lastMsg.name;

                        // 1. Chuẩn hóa dữ liệu (Reverse để tin mới nhất ở dưới cùng)
                        const history = [...responseData].reverse();

                        // 2. Dispatch vào Slice Mới
                        // LƯU Ý: Không cần check currentChatState.name === partnerName
                        // Cứ lưu vào store, dù user có đang xem hay không.
                        store.dispatch(setMessages({
                            target: partnerName,
                            messages: history
                        }));

                    } else if (Array.isArray(responseData) && responseData.length === 0) {
                        // Nếu mảng rỗng, ta chỉ có thể clear nếu đang mở đúng chat đó
                        // (Do API không trả về tên người khi mảng rỗng)
                        if (currentChatState.type === 'people' && currentChatState.name) {
                            store.dispatch(setMessages({
                                target: currentChatState.name,
                                messages: []
                            }));
                        }
                    }
                    break;

                case 'GET_ROOM_CHAT_MES':
                    if (responseData && responseData.name) { // Check kỹ hơn chút
                        const roomName = responseData.name;
                        const chatData = responseData.chatData || []; // Fallback nếu null

                        // 1. Chuẩn hóa dữ liệu
                        const history = [...chatData].reverse();

                        // 2. Dispatch vào Slice Mới
                        // Tương tự, lưu luôn vào store theo target là tên phòng
                        store.dispatch(setMessages({
                            target: roomName,
                            messages: history
                        }));
                    }
                    break;

                case 'SEND_CHAT':
                    console.group("🔥 DEBUG: SEND_CHAT Event");
                    console.log("1. Raw Data from Server:", responseData);

                    if (responseData) {
                        const rawData = responseData;

                        const { to, mes, name: senderName, type, createAt } = rawData;

                        if (!to || !senderName) {
                            console.error(" Dữ liệu tin nhắn thiếu 'to' hoặc 'senderName'", rawData);
                            console.groupEnd();
                            break;
                        }

                        const messageType = (type === 1 || type === 'room') ? 'room' : 'people';

                        let target = '';
                        if (messageType === 'room') {
                            target = to;
                        } else {
                            target = senderName === myUsername ? to : senderName;
                        }

                        console.log(`2. Logic Check:`);
                        console.log(`   - My Username: ${myUsername}`);
                        console.log(`   - Sender: ${senderName}`);
                        console.log(`   - To: ${to}`);
                        console.log(`   => CALCULATED TARGET: "${target}"`);

                        const newMessage: ChatMessage = {

                            name: senderName,
                            to: to,
                            mes: mes,
                            type: messageType,
                            createAt: createAt || new Date().toISOString()
                        };

                        console.log("3. Dispatching addMessage action...");
                        store.dispatch(addMessage({
                            target: target,
                            message: newMessage
                        }));

                        const state = store.getState();
                        const currentChat = state.currentChat;

                        // Nếu tin nhắn KHÔNG PHẢI do mình gửi
                        // VÀ (mình đang không mở chat HOẶC đang mở chat với người khác)
                        const isMyMessage = senderName === myUsername;

                        if (!isMyMessage) {
                            if (currentChat.name !== target) {
                                store.dispatch(increaseUnread(target));
                            }
                        }
                    }
                    console.groupEnd();


                    break;

                case 'GET_USER_LIST':

                    // console.group("🔍 DEBUG GET_USER_LIST");
                    // console.log("1. Raw Response Data:", responseData);
                    // console.log("2. Total count from Server:", Array.isArray(responseData) ? responseData.length : 'Not Array');

                    if (Array.isArray(responseData)) {
                        // 1. Map dữ liệu thô sang format chuẩn
                        let allPartners: ChatPartner[] = responseData.map((item: any) => ({
                            name: item.name,
                            type: (item.type === 1 ? 'room' : 'people') as 'room' | 'people',
                            actionTime: item.actionTime,
                            isOnline: false,
                        }));


                        // 2. LỌC NGAY TẠI ĐÂY (Logic Whitelist)
                        // Chỉ giữ lại những người có tên trong CHAT_WHITELIST
                        const whitelistedPartners = allPartners.filter(p => CHAT_WHITELIST.includes(p.name));

                        // 3. Sắp xếp (nếu cần)
                        whitelistedPartners.sort((a, b) => {
                            if (!a.actionTime || !b.actionTime) return 0;
                            return new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime();
                            console.log(a.actionTime,b.actionTime);
                        });

                        // 4. DISPATCH (Lúc này trong Slice chỉ có những người trong Whitelist)
                        store.dispatch(setPartners(whitelistedPartners));

                        this.checkOnlineQueue = [];

                        // 5. Chạy vòng lặp lấy dữ liệu chi tiết (Dùng chính list đã lọc để chạy)
                        whitelistedPartners.forEach((partner, index) => {
                            setTimeout(() => {
                                if (partner.type === 'people') {
                                    // A. Ghi tên vào hàng đợi (Xếp hàng)
                                    this.checkOnlineQueue.push(partner.name);

                                    // B. Gửi câu hỏi lên Server
                                    this.checkUserOnline(partner.name);
                                    this.getHistory(partner.name);
                                } else if (partner.type === 'room') {
                                    this.getRoomHistory(partner.name, 1);
                                }
                            }, index * 300);
                        });
                    }
                    break;

                case 'CREATE_ROOM':
                case 'JOIN_ROOM':
                    this.getUserList();
                    break;

                case 'CHECK_USER_ONLINE':

                    if (responseData) {
                        const isOnline = responseData.status;
                        const targetUser = this.checkOnlineQueue.shift();

                        if (targetUser) {
                            store.dispatch(updatePartnerOnline({
                                name: targetUser,
                                isOnline: isOnline
                            }));
                        }
                    }
                    break;
            }
        } else if (status === 'error') {
            const errorMessage = payload.mes || 'Có lỗi xảy ra';
            console.error('Socket Error:', errorMessage);

            if (errorMessage === 'User not Login') {
                const user = localStorage.getItem('username');
                const code = localStorage.getItem('reLoginCode');
                if (user && code) this.reLogin(user, code);
                else store.dispatch(loginFailure("Phiên đăng nhập hết hạn"));
            } else if (['LOGIN', 'RE_LOGIN', 'REGISTER'].includes(event)) {
                store.dispatch(loginFailure(errorMessage));
            }
        }
    }

    private startHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
            }
        }, HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async attemptReconnect() {
        await this.connect();
        const username = localStorage.getItem('username');
        const reLoginCode = localStorage.getItem('reLoginCode');
        if (username && reLoginCode) this.reLogin(username, reLoginCode);
    }

    private send(payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({action: 'onchat', data: payload}));
        } else {
            console.error('Socket not connected');
        }
    }

    register(user: string, pass: string) {
        localStorage.setItem('username', user);
        this.send({event: 'REGISTER', data: {user, pass}});
    }

    login(user: string, pass: string) {
        localStorage.setItem('username', user);
        this.send({event: 'LOGIN', data: {user, pass}});
    }

    reLogin(user: string, code: string) {
        this.send({event: 'RE_LOGIN', data: {user, code}});
    }

    logout() {
        this.shouldReconnect = false;
        this.send({event: 'LOGOUT'});
    }

    sendMessageToPeople(toUser: string, message: string) {
        this.send({event: 'SEND_CHAT', data: {type: 'people', to: toUser, mes: message}});
    }

    getHistory(partnerName: string) {
        this.send({event: 'GET_PEOPLE_CHAT_MES', data: {name: partnerName, page: 1}});
    }

    getRoomHistory(roomName: string, page: number = 1) {
        this.send({event: 'GET_ROOM_CHAT_MES', data: {name: roomName, page}});
    }

    sendMessageToRoom(roomName: string, message: string) {
        this.send({event: 'SEND_CHAT', data: {type: 'room', to: roomName, mes: message}});
    }

    getUserList() {
        this.send({event: 'GET_USER_LIST'});
    }

    createRoom(roomName: string) {
        this.send({event: 'CREATE_ROOM', data: {name: roomName}});
    }

    joinRoom(roomName: string) {
        this.send({event: 'JOIN_ROOM', data: {name: roomName}});
    }

    checkUserExist(username: string) {
        this.send({event: 'CHECK_USER_EXIST', data: {user: username}});
    }

    checkUserOnline(username: string) {
        this.send({event: 'CHECK_USER_ONLINE', data: {user: username}});
    }

    disconnect() {
        this.shouldReconnect = false;
        this.stopHeartbeat();
        this.socket?.close();
    }

    reconnect() {
        this.disconnect();
        return this.connect();
    }
}

export const socketService = new SocketService();