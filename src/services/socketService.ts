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
import {setUserList} from "../store/slices/userListSlice";

const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const HEARTBEAT_INTERVAL = 30000; // ping mỗi 30s để giữ kế nối server
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

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

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        store.dispatch(setUserList(responseData));
                        console.log('Đã nhận danh sách user:', responseData.map((u: any) => u.name).join(', '));
                    } else {
                        console.warn('GET_USER_LIST data không hợp lệ:', responseData);
                    }
                    break;

                case 'GET_PEOPLE_CHAT_MES':
                    const historyData = responseData;
                    console.log("Server trả về lịch sử chat raw:", historyData);
                    if (Array.isArray(historyData)) {
                        const sortedMessages = [...historyData].reverse();
                        store.dispatch(setMessages(sortedMessages));
                        console.log("Đã tải lịch sử chat:", sortedMessages.length, "tin nhắn");
                    }
                    break;

                case 'SEND_CHAT':
                    if (responseData) {
                        store.dispatch(addMessage(responseData));
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

    // Tạo phòng chat mới
    createRoom(roomName: string) {
        this.send({
            event: 'CREATE_ROOM',
            data: {name: roomName}
        });
    }

    // Tham gia phòng chat
    joinRoom(roomName: string) {
        this.send({
            event: 'JOIN_ROOM',
            data: {name: roomName}
        });
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

    // Kiểm tra user có tồn tại không
    checkUserExist(username: string) {
        this.send({
            event: 'CHECK_USER_EXIST',
            data: {user: username}
        });
    }

    // Kiểm tra user có online không
    checkUserOnline(username: string) {
        this.send({
            event: 'CHECK_USER_ONLINE',
            data: {user: username}
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
}

export const socketService = new SocketService();