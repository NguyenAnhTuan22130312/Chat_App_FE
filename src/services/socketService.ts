import {
    loginFailure,
    loginSuccess,
    registerSuccess,
    socketConnected,
    socketDisconnected,
    socketConnectionError
} from "../store/slices/authSlice";
import {addMessage, setMessages} from "../store/slices/chatSlice";
import {store} from "../store/store";
import {ChatPartner, setPartners} from "../store/slices/chatPartnerSlice";
import { setLastMessage } from "../store/slices/lastMessageSlice";
import { increaseUnread } from "../store/slices/unreadSlice";


const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const HEARTBEAT_INTERVAL = 30000; // ping mỗi 30s để giữ kế nối server
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;
// Trong file socketService.ts, thêm ở đầu class hoặc ngoài class
const CHAT_WHITELIST = [
    // Rooms
    '22130302',
    'ABC',
    'trunghan',
    // Users
    'anhtuan12',
    'hantr',
    'long',
    'hant123',
    // Thêm sau nếu cần: 'trunghan', 'join4', ...
];

class SocketService {
    private socket: WebSocket | null = null;
    private connectionReady: Promise<void> | null = null;
    private resolveConnection: (() => void) | null = null;
    private rejectConnection: ((error: Error) => void) | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private shouldReconnect: boolean = true;
    private reconnectAttempts: number = 0;

    /*
     * kết nối tới web socket
     * @param onMessageReceived - callback nhận message từ server (dùng cho custom handling)
     */
    connect(): Promise<void> {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        if (this.connectionReady) {
            return this.connectionReady;
        }

        // Tạo Promise để đợi connection
        this.connectionReady = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;
            this.rejectConnection = reject;
        });

        this.socket = new WebSocket(SOCKET_URL);

        this.socket.onopen = () => {
            this.reconnectAttempts = 0;
            store.dispatch(socketConnected());
            this.startHeartbeat();
            if (this.resolveConnection) {
                this.resolveConnection();
            }
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleServerResponse(data);
        };

        this.socket.onerror = (error) => {
            console.error('Lỗi: ', error);
            const errorMsg = 'Lỗi kết nối.';
            store.dispatch(socketConnectionError(errorMsg));
            if (this.rejectConnection) {
                this.rejectConnection(new Error(errorMsg));
            }
        };

        this.socket.onclose = (event) => {
            console.log('Đóng kết nối:', event.code, event.reason);

            this.stopHeartbeat();
            store.dispatch(socketDisconnected());
            this.connectionReady = null;
            this.resolveConnection = null;
            this.rejectConnection = null;

            // Tự động kết nối lại nếu được bật và chưa vượt quá số lần thử
            if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                this.reconnectAttempts++;
                console.log(`Số lần thử kết nối lại (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

                setTimeout(() => {
                    this.attemptReconnect();
                }, RECONNECT_DELAY);
            } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                store.dispatch(socketConnectionError('Không thể kết nối lại. Tải lại trang.'));
            }
        };

        return this.connectionReady;
    }

    /**
     * Xử lý response từ server và dispatch Redux actions tương ứng
     */
    private handleServerResponse(receivedData: any) {
        console.log('Raw received:', receivedData); // Debug: xem chính xác cấu trúc

        // QUAN TRỌNG: Server luôn bọc trong { action: "onchat", data: { ... } } hoặc gửi thẳng data
        const payload = receivedData.action === 'onchat' ? receivedData.data : receivedData;
        const event = payload.event;
        const status = payload.status;
        const responseData = payload.data;

        console.log('Processed payload:', {event, status, responseData}); // Debug

        if (status === 'success') {
            switch (event) {
                case 'LOGIN':
                case 'RE_LOGIN':
                    const reLoginCode = responseData?.RE_LOGIN_CODE;
                    const username = localStorage.getItem('username') || '';
                    store.dispatch(loginSuccess({
                        user: {username},
                        reLoginCode: reLoginCode,
                    }));
                    console.log('Login/Relogin success, code:', reLoginCode);
                    // Gọi lấy danh sách user
                    this.getUserList();
                    break;

                case 'REGISTER':
                    const registerCode = responseData?.RE_LOGIN_CODE;
                    const registerUser = localStorage.getItem('username') || '';
                    store.dispatch(registerSuccess());
                    store.dispatch(loginSuccess({
                        user: {username: registerUser},
                        reLoginCode: registerCode,
                    }));
                    console.log('Đăng ký thành công');
                    this.getUserList();
                    break;



                case 'GET_PEOPLE_CHAT_MES':
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const lastMsg = responseData[0];

                        const currentUsername = localStorage.getItem('username') || '';
                        const partnerName = lastMsg.name === currentUsername ? lastMsg.to : lastMsg.name;

                        store.dispatch(setLastMessage({
                            partnerName,
                            message: lastMsg.mes,
                            timestamp: lastMsg.createAt || new Date().toISOString(),
                            senderName: lastMsg.name,
                        }));

                        console.log(`Last message cho partner ${partnerName}: ${lastMsg.mes} (từ ${lastMsg.name})`);
                    }
                    break;


                case 'GET_ROOM_CHAT_MES':
                    if (responseData && responseData.chatData && Array.isArray(responseData.chatData)) {
                        // Giả sử code cũ của nhóm bạn có dispatch lịch sử vào chatSlice ở đây
                        // (nếu có thì giữ nguyên)

                        // === THÊM: Cập nhật last message cho phòng ===
                        const chatData = responseData.chatData;
                        if (chatData.length > 0) {
                            const lastMsgRaw = chatData[0];
                            const partnerName = responseData.name; // tên phòng

                            store.dispatch(setLastMessage({
                                partnerName,
                                message: lastMsgRaw.mes,
                                timestamp: lastMsgRaw.createAt || new Date().toISOString(),
                                senderName: lastMsgRaw.name,
                            }));
                        }
                    }
                    break;

                case 'SEND_CHAT':
                    if (responseData) {
                        // 1. Add tin nhắn vào store (giữ nguyên code cũ của bạn)
                        store.dispatch(addMessage(responseData));

                        const { to, mes, name: senderName, createAt, type } = responseData;
                        const currentUsername = localStorage.getItem('username') || '';

                        // Chuẩn hóa loại chat (API của bạn lúc thì trả về string 'room', lúc thì số 1/0 nên check cả 2 cho chắc)
                        const isRoom = type === 'room' || type === 1;
                        const isPeople = type === 'people' || type === 0;

                        // 2. Cập nhật Last Message (Tin nhắn cuối)
                        if (to && mes) {
                            // Logic xác định đối tượng chat để hiển thị ở Sidebar:
                            // - Nếu là Room: LastMessage gán cho tên Room (biến 'to')
                            // - Nếu là People:
                            //    + Người khác gửi mình -> Gán cho người gửi ('senderName')
                            //    + Mình gửi người khác -> Gán cho người nhận ('to')
                            let partnerNameForLastMsg = to;
                            if (isPeople && senderName !== currentUsername) {
                                partnerNameForLastMsg = senderName;
                            }

                            const timestamp = createAt || new Date().toISOString();

                            store.dispatch(setLastMessage({
                                partnerName: partnerNameForLastMsg,
                                message: mes,
                                timestamp,
                                senderName: senderName || 'Unknown',
                            }));

                            // Gọi refresh list user để sort lại thứ tự (người mới nhắn nhảy lên đầu)
                            // socketService.getUserList(); // Có thể bật lại nếu server không tự push event update list
                        }

                        // === 3. FIX LOGIC UNREAD (TĂNG SỐ TIN CHƯA ĐỌC) ===
                        // Điều kiện: Không phải tin mình gửi đi
                        if (senderName !== currentUsername) {

                            // Xác định ai là người cần hiện dấu đỏ (Key trong object unreadCounts)
                            // - Chat nhóm: Key là tên phòng ('to')
                            // - Chat riêng: Key là tên thằng gửi ('senderName')
                            const targetUnreadKey = isRoom ? to : senderName;

                            // Kiểm tra xem mình có đang mở chat với đối tượng này không?
                            const currentChat = store.getState().currentChat;

                            // So sánh tên và loại (để tránh trùng tên giữa user và room)
                            const isViewingThisChat =
                                currentChat.name === targetUnreadKey &&
                                currentChat.type === (isRoom ? 'room' : 'people');

                            // Nếu KHÔNG ĐANG XEM thì mới tăng số tin chưa đọc
                            if (!isViewingThisChat) {
                                store.dispatch(increaseUnread(targetUnreadKey));
                            }
                        }
                    }
                    break;

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        const partners: ChatPartner[] = responseData.map((item: any) => ({
                            name: item.name,
                            type: item.type === 1 ? 'room' : 'people',
                            actionTime: item.actionTime,
                        }));

                        // Sort mới nhất lên đầu
                        partners.sort((a, b) => {
                            if (!a.actionTime || !b.actionTime) return 0;
                            return new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime();
                        });

                        store.dispatch(setPartners(partners));

                        // === CHỈ LOAD LAST MESSAGE CHO CÁC PARTNER TRONG WHITELIST ===
                        const partnersToLoad = partners.filter(p =>
                            CHAT_WHITELIST.includes(p.name)
                        );

                        console.log(`Đang load last message cho ${partnersToLoad.length} partner quan trọng:`, partnersToLoad.map(p => p.name));

                        partnersToLoad.forEach((partner, index) => {
                            // Thêm delay nhỏ để tránh burst request (rất an toàn)
                            setTimeout(() => {
                                if (partner.type === 'people') {
                                    socketService.getHistory(partner.name);
                                } else if (partner.type === 'room') {
                                    socketService.getRoomHistory(partner.name, 1);
                                }
                            }, index * 300); // 300ms giữa mỗi request
                        });
                    }
                    break;
                case 'CREATE_ROOM':
                case 'JOIN_ROOM':
                    console.log(`${event} thành công:`, responseData?.name || 'unknown');
                    // Server sẽ tự thêm room vào GET_USER_LIST → gọi lại để refresh
                    this.getUserList();
                    break;

                case 'CHECK_USER_ONLINE':
                    if (responseData && typeof responseData.status === 'boolean') {
                        // Lưu ý: hiện tại response không có username → cần cải thiện sau
                        // Tạm thời log thôi
                        console.log('Online status received:', responseData.status);
                        // Khi build sidebar, ta sẽ xử lý chi tiết hơn (ví dụ gọi khi hover)
                    }
                    break;

                default:
                    console.log('Event khác:', event);
                    break;

            }
        } else if (status === 'error') {
            const errorMessage = payload.mes || 'Có lỗi xảy ra';
            console.error('Lỗi :', errorMessage);

            // Xử lý đặc biệt khi hết hạn đăng nhập
            if (errorMessage === 'User not Login') {
                console.warn('Chưa đăng nhập. Đang tự động đăng nhập lại...');
                const user = localStorage.getItem('username');
                const code = localStorage.getItem('reLoginCode');
                if (user && code) {
                    this.reLogin(user, code);
                } else {
                    store.dispatch(loginFailure("Phiên đăng nhập hết hạn"));
                }
                return;
            }

            // Xử lý lỗi login/register
            if (event === 'LOGIN' || event === 'RE_LOGIN' || event === 'REGISTER') {
                store.dispatch(loginFailure(errorMessage));
            }
        }
    }

    /**
     * Bắt đầu giữ kết nối
     */
    private startHeartbeat() {
        // Xóa existing interval nếu có
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Gửi ping message mỗi 30s
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.send({
                        event: 'PING'
                    });
                    console.log('Heartbeat sent');
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

        // Auto re-login nếu có credentials
        const username = localStorage.getItem('username');
        const reLoginCode = localStorage.getItem('reLoginCode');

        if (username && reLoginCode) {
            console.log('Đang tự động đăng nhập lại...');
            this.reLogin(username, reLoginCode);
        }
    }

    /**
     * Gửi data tới server (hàm onchat chung)
     */
    private send(payload: any) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({
                action: 'onchat',
                data: payload
            });
            this.socket.send(message);
        } else {
            console.error('Socket not connected');
            throw new Error('WebSocket chưa kết nối');
        }
    }


    // đăng ký
    async register(user: string, pass: string) {
        await this.connectionReady;

        // Lưu username vào localStorage để dùng khi nhận response
        localStorage.setItem('username', user);

        this.send({
            event: 'REGISTER',
            data: {
                user: user,
                pass: pass
            }
        });
    }

    // đăng nhập
    async login(user: string, pass: string) {
        await this.connectionReady;

        // Lưu username vào localStorage để dùng khi nhận response
        localStorage.setItem('username', user);
        this.send({
            event: 'LOGIN',
            data: {
                user: user,
                pass: pass
            }
        });
    }

    // Tự động đăng nhập lại
    reLogin(user: string, code: string) {
        this.send({
            event: 'RE_LOGIN',
            data: {
                user: user,
                code: code
            }
        });
    }


    // Đăng xuất
    logout() {
        this.shouldReconnect = false;

        this.send({
            event: 'LOGOUT'
        });
    }

    // chat với người
    sendMessageToPeople(toUser: string, message: string) {
        this.send({
            event: 'SEND_CHAT',
            data: {
                type: 'people',
                to: toUser,
                mes: message
            }
        });
    }

    // lấy lịch sử chat
    getHistory(partnerName: string) {
        this.send({
            event: 'GET_PEOPLE_CHAT_MES',
            data: {
                name: partnerName,
                page: 1
            }
        });
    }

    disconnect() {
        // Tắt auto-reconnect khi disconnect chủ động
        this.shouldReconnect = false;
        this.stopHeartbeat();

        if (this.socket) {
            this.socket.close();
        }
    }


    // Lấy lịch sử tin nhắn phòng (page bắt đầu từ 1)
    getRoomHistory(roomName: string, page: number = 1) {
        this.send({
            event: 'GET_ROOM_CHAT_MES',
            data: {name: roomName, page}
        });
    }

    // Gửi tin nhắn vào phòng
    sendMessageToRoom(roomName: string, message: string) {
        this.send({
            event: 'SEND_CHAT',
            data: {
                type: 'room',
                to: roomName,
                mes: message
            }
        });
    }

    // Lấy danh sách tất cả user đang đăng ký
    getUserList() {
        this.send({
            event: 'GET_USER_LIST'
        });
    }

    /**
     * Kết nối lại với socket server
     */
    reconnect(): Promise<void> {
        this.disconnect();
        // Thử kết nối lại
        return this.connect();
    }

    // Tạo phòng chat mới
    createRoom(roomName: string) {
        this.send({
            event: 'CREATE_ROOM',
            data: { name: roomName }
        });
    }

// Tham gia phòng chat
    joinRoom(roomName: string) {
        this.send({
            event: 'JOIN_ROOM',
            data: { name: roomName }
        });
    }

// Kiểm tra user có tồn tại không
    checkUserExist(username: string) {
        this.send({
            event: 'CHECK_USER_EXIST',
            data: { user: username }
        });
    }

// Kiểm tra user có online không
    checkUserOnline(username: string) {
        this.send({
            event: 'CHECK_USER_ONLINE',
            data: { user: username }
        });
    }


}

export const socketService = new SocketService();