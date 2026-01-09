import {
    loginFailure,
    loginSuccess,
    registerSuccess,
    socketConnected,
    socketDisconnected,
    socketConnectionError
} from "../store/slices/authSlice";
import { addMessage, setMessages } from "../store/slices/chatSlice";
import { store } from "../store/store";
import { ChatPartner, setPartners } from "../store/slices/chatPartnerSlice";
import { setLastMessage } from "../store/slices/lastMessageSlice";

const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const HEARTBEAT_INTERVAL = 30000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

const CHAT_WHITELIST = [
    '22130302', 'ABC', 'trunghan', 'anhtuan12', 'hantr', 'long', 'hant123'
];

class SocketService {
    private socket: WebSocket | null = null;
    private connectionReady: Promise<void> | null = null;
    private resolveConnection: (() => void) | null = null;
    private rejectConnection: ((error: Error) => void) | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private shouldReconnect: boolean = true;
    private reconnectAttempts: number = 0;

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
        const { event, status, data: responseData } = payload;
        
        // Lấy thông tin chat hiện tại từ Redux store để so sánh
        const currentChatState = store.getState().currentChat;
        const myUsername = store.getState().auth.user?.username || localStorage.getItem('username');

        if (status === 'success') {
            switch (event) {
                case 'LOGIN':
                case 'RE_LOGIN':
                    const reLoginCode = responseData?.RE_LOGIN_CODE;
                    store.dispatch(loginSuccess({
                        user: { username: myUsername || '' },
                        reLoginCode: reLoginCode,
                    }));
                    this.getUserList();
                    break;

                case 'REGISTER':
                    store.dispatch(registerSuccess());
                    store.dispatch(loginSuccess({
                        user: { username: myUsername || '' },
                        reLoginCode: responseData?.RE_LOGIN_CODE,
                    }));
                    this.getUserList();
                    break;

                case 'GET_PEOPLE_CHAT_MES':
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const lastMsg = responseData[0];
                        const partnerName = lastMsg.name === myUsername ? lastMsg.to : lastMsg.name;

                        store.dispatch(setLastMessage({
                            partnerName,
                            message: lastMsg.mes,
                            timestamp: lastMsg.createAt || new Date().toISOString(),
                            senderName: lastMsg.name,
                        }));

                        if (currentChatState.type === 'people' && currentChatState.name === partnerName) {
                            const history = [...responseData].reverse();
                            store.dispatch(setMessages(history));
                        }
                    } else if (Array.isArray(responseData) && responseData.length === 0) {
                         if (currentChatState.type === 'people') {
                             store.dispatch(setMessages([]));
                         }
                    }
                    break;

                case 'GET_ROOM_CHAT_MES':
                    if (responseData && responseData.chatData) {
                        const roomName = responseData.name;
                        const chatData = responseData.chatData;

                        if (chatData.length > 0) {
                            const lastMsgRaw = chatData[0];
                            store.dispatch(setLastMessage({
                                partnerName: roomName,
                                message: lastMsgRaw.mes,
                                timestamp: lastMsgRaw.createAt || new Date().toISOString(),
                                senderName: lastMsgRaw.name,
                            }));
                        }

                        if (currentChatState.type === 'room' && currentChatState.name === roomName) {
                            const history = [...chatData].reverse();
                            store.dispatch(setMessages(history));
                        }
                    }
                    break;

                case 'SEND_CHAT':
                    if (responseData) {
                        const { to, mes, name: senderName, createAt, type } = responseData;
                        const isMyMessage = senderName === myUsername;
                        
                        const isRelevantToCurrentChat = 
                            (type === 'room' && to === currentChatState.name) ||
                            (type === 'people' && (to === currentChatState.name || senderName === currentChatState.name));

                        if (isRelevantToCurrentChat) {
                            store.dispatch(addMessage(responseData));
                        }

                        const partnerForSidebar = type === 'room' ? to : (isMyMessage ? to : senderName);
                        store.dispatch(setLastMessage({
                            partnerName: partnerForSidebar,
                            message: mes,
                            timestamp: createAt || new Date().toISOString(),
                            senderName: senderName,
                        }));
                        
                        this.getUserList();
                    }
                    break;

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        // FIX LỖI Ở ĐÂY: Ép kiểu 'room' | 'people'
                        const partners: ChatPartner[] = responseData.map((item: any) => ({
                            name: item.name,
                            type: (item.type === 1 ? 'room' : 'people') as 'room' | 'people',
                            actionTime: item.actionTime,
                        })).sort((a, b) => {
                            if (!a.actionTime || !b.actionTime) return 0;
                            return new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime();
                        });

                        store.dispatch(setPartners(partners));

                        const partnersToLoad = partners.filter(p => CHAT_WHITELIST.includes(p.name));
                        partnersToLoad.forEach((partner, index) => {
                            setTimeout(() => {
                                if (partner.type === 'people') this.getHistory(partner.name);
                                else if (partner.type === 'room') this.getRoomHistory(partner.name, 1);
                            }, index * 300);
                        });
                    }
                    break;

                case 'CREATE_ROOM':
                case 'JOIN_ROOM':
                    this.getUserList();
                    break;
                    
                case 'CHECK_USER_ONLINE':
                    console.log('Online status:', responseData.status);
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
            this.socket.send(JSON.stringify({ action: 'onchat', data: payload }));
        } else {
            console.error('Socket not connected');
        }
    }

    register(user: string, pass: string) {
        localStorage.setItem('username', user);
        this.send({ event: 'REGISTER', data: { user, pass } });
    }

    login(user: string, pass: string) {
        localStorage.setItem('username', user);
        this.send({ event: 'LOGIN', data: { user, pass } });
    }

    reLogin(user: string, code: string) {
        this.send({ event: 'RE_LOGIN', data: { user, code } });
    }

    logout() {
        this.shouldReconnect = false;
        this.send({ event: 'LOGOUT' });
    }

    sendMessageToPeople(toUser: string, message: string) {
        this.send({ event: 'SEND_CHAT', data: { type: 'people', to: toUser, mes: message } });
    }

    getHistory(partnerName: string) {
        this.send({ event: 'GET_PEOPLE_CHAT_MES', data: { name: partnerName, page: 1 } });
    }

    getRoomHistory(roomName: string, page: number = 1) {
        this.send({ event: 'GET_ROOM_CHAT_MES', data: { name: roomName, page } });
    }

    sendMessageToRoom(roomName: string, message: string) {
        this.send({ event: 'SEND_CHAT', data: { type: 'room', to: roomName, mes: message } });
    }

    getUserList() {
        this.send({ event: 'GET_USER_LIST' });
    }

    createRoom(roomName: string) {
        this.send({ event: 'CREATE_ROOM', data: { name: roomName } });
    }

    joinRoom(roomName: string) {
        this.send({ event: 'JOIN_ROOM', data: { name: roomName } });
    }
    
    checkUserExist(username: string) {
        this.send({ event: 'CHECK_USER_EXIST', data: { user: username } });
    }
    
    checkUserOnline(username: string) {
        this.send({ event: 'CHECK_USER_ONLINE', data: { user: username } });
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