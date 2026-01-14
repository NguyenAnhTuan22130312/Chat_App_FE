import {
    loginFailure,
    loginSuccess,
    registerSuccess,
    socketConnected,
    socketDisconnected,
    socketConnectionError
} from "../store/slices/authSlice";
import {addMessage, ChatMessage, setMessages, addHistoryMessages} from "../store/slices/chatSlice";
import {store} from "../store/store";
import {ChatPartner, setPartners, updatePartnerOnline} from "../store/slices/chatPartnerSlice";
import {increaseUnread} from "../store/slices/unreadSlice";
import { parseReplyMessage } from "../utils/replyUtils";


const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const HEARTBEAT_INTERVAL = 30000;
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

type WebRTCSignalCallback = (sender: string, data: any) => void;

const CHAT_WHITELIST = [
    '22130302', 'trunghan', 'anhtuan12', 'hantr', 'long','AnhTuan11','Qte','tuanroomtest','tuantest',
    '22130312_anhtuan', '22130302_hantrung', '22130311_NguyenAnhTuan', 'Nhom_63'
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
    private onWebRTCSignal: WebRTCSignalCallback | null = null;

    public registerWebRTCListener(callback: WebRTCSignalCallback) {
        this.onWebRTCSignal = callback;
    }

    public sendWebRTCSignal(toUser: string, data: any) {
        const signalMessage = JSON.stringify({
            type: 'WEBRTC_SIGNAL',
            payload: data
        });
        this.sendMessageToPeople(toUser, signalMessage);
    }

    private isWebRTCSignal(mes: string): any | null {
        try {
            if (!mes.startsWith('{')) return null;
            const parsed = JSON.parse(mes);
            if (parsed && parsed.type === 'WEBRTC_SIGNAL') {
                return parsed.payload;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

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
        const IS_STRESS_TEST_MODE = false;

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
                    if (Array.isArray(responseData) && responseData.length > 0) {
                        const lastMsg = responseData[0];
                        const partnerName = lastMsg.name === myUsername ? lastMsg.to : lastMsg.name;

                        const history = [...responseData]
                            .filter((msg: any) => !this.isWebRTCSignal(msg.mes))
                            .reverse()
                            .map((msg: any) => {
                                const { replyTo, mes: parsedMessage } = parseReplyMessage(msg.mes);
                                return {
                                    ...msg,
                                    mes: parsedMessage,
                                    replyTo: replyTo || undefined,
                                };
                            });

                        const currentMsgs = store.getState().chat.messagesByTarget[partnerName];

                        if (!currentMsgs || currentMsgs.length === 0) {
                            store.dispatch(setMessages({
                                target: partnerName,
                                messages: history
                            }));
                        } else {
                            store.dispatch(addHistoryMessages({
                                target: partnerName,
                                messages: history
                            }));
                        }

                    } else if (Array.isArray(responseData) && responseData.length === 0) {
                        if (currentChatState.type === 'people' && currentChatState.name) {
                            const currentMsgs = store.getState().chat.messagesByTarget[currentChatState.name];
                            if (!currentMsgs || currentMsgs.length === 0) {
                                store.dispatch(setMessages({ target: currentChatState.name, messages: [] }));
                            }
                        }
                    }
                    break;

                case 'GET_ROOM_CHAT_MES':
                    if (responseData && responseData.name) {
                        const roomName = responseData.name;
                        const chatData = responseData.chatData || [];
                        const history = [...chatData]
                            .filter((msg: any) => !this.isWebRTCSignal(msg.mes))
                            .reverse()
                            .map((msg: any) => {
                                const { replyTo, mes: parsedMessage } = parseReplyMessage(msg.mes);
                                return {
                                    ...msg,
                                    mes: parsedMessage,
                                    replyTo: replyTo || undefined,
                                };
                            });

                        const currentMsgs = store.getState().chat.messagesByTarget[roomName];

                        if (!currentMsgs || currentMsgs.length === 0) {
                            store.dispatch(setMessages({
                                target: roomName,
                                messages: history
                            }));
                        } else {
                            store.dispatch(addHistoryMessages({
                                target: roomName,
                                messages: history
                            }));
                        }
                    }
                    break;

                case 'SEND_CHAT':
                    if (responseData) {
                        const { to, mes, name: senderName, type, createAt } = responseData;

                        const signalPayload = this.isWebRTCSignal(mes);
                        if (signalPayload) {
                            if (this.onWebRTCSignal && senderName !== myUsername) {
                                this.onWebRTCSignal(senderName, signalPayload);
                            }
                            break;
                        }

                        if (!to || !senderName) {
                            break;
                        }

                        const messageType = (type === 1 || type === 'room') ? 'room' : 'people';

                        let target = '';
                        if (messageType === 'room') {
                            target = to;
                        } else {
                            target = senderName === myUsername ? to : senderName;
                        }

                        const { replyTo, mes: parsedMessage } = parseReplyMessage(mes);

                        const newMessage: ChatMessage = {
                            name: senderName,
                            to: to,
                            mes: parsedMessage,
                            type: messageType,
                            createAt: createAt || new Date().toISOString(),
                            replyTo: replyTo || undefined,
                        };

                        store.dispatch(addMessage({
                            target: target,
                            message: newMessage
                        }));

                        const state = store.getState();
                        const currentChat = state.currentChat;

                        const isMyMessage = senderName === myUsername;

                        if (!isMyMessage) {
                            if (currentChat.name !== target) {
                                store.dispatch(increaseUnread(target));
                            }
                        }
                    }
                    break;

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        let allPartners: ChatPartner[] = responseData.map((item: any) => ({
                            name: item.name,
                            type: (item.type === 1 ? 'room' : 'people') as 'room' | 'people',
                            actionTime: item.actionTime,
                            isOnline: false,
                        }));

                        let partnersToProcess: ChatPartner[] = [];

                        if (IS_STRESS_TEST_MODE) {
                            partnersToProcess = allPartners;
                        } else {
                            partnersToProcess = allPartners.filter(p => CHAT_WHITELIST.includes(p.name));
                        }

                        partnersToProcess.sort((a, b) => {
                            if (!a.actionTime || !b.actionTime) return 0;
                            return new Date(b.actionTime).getTime() - new Date(a.actionTime).getTime();
                        });

                        store.dispatch(setPartners(partnersToProcess));

                        this.checkOnlineQueue = [];

                        partnersToProcess.forEach((partner, index) => {
                            const delayTime = IS_STRESS_TEST_MODE ? 100 : 300;

                            setTimeout(() => {
                                if (partner.type === 'people') {
                                    this.checkOnlineQueue.push(partner.name);
                                    this.checkUserOnline(partner.name);
                                    this.getHistory(partner.name);
                                } else if (partner.type === 'room') {
                                    this.getRoomHistory(partner.name, 1);
                                }
                            }, index * delayTime);
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

    public getHistory(partnerName: string, page: number = 1) {
        console.log(`Requesting history for ${partnerName} - Page: ${page}`);
        this.send({event: 'GET_PEOPLE_CHAT_MES', data: {name: partnerName, page}});
    }

    public getRoomHistory(roomName: string, page: number = 1) {
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