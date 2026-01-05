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
const CONNECTION_TIMEOUT = 30000; // 30s
const MAX_RETRY_ATTEMPTS = 3;
const HEARTBEAT_INTERVAL = 30000; // 30s - ping mỗi 30s để keep alive
const RECONNECT_DELAY = 3000; // 3s - delay trước khi reconnect
const MAX_RECONNECT_ATTEMPTS = 5; // Số lần thử reconnect tối đa

class SocketService {
    private socket: WebSocket | null = null;
    private messageCallback: (data: any) => void = () => {
    };
    private connectionReady: Promise<void> | null = null;
    private resolveConnection: (() => void) | null = null;
    private rejectConnection: ((error: Error) => void) | null = null;
    private connectionTimeout: NodeJS.Timeout | null = null;
    private retryCount: number = 0;
    // Auto-reconnect and heartbeat properties
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private shouldReconnect: boolean = true;
    private reconnectAttempts: number = 0;

    /**
     * kết nối tới web socket
     * @param onMessageReceived - callback nhận message từ server (dùng cho custom handling)
     */
    connect(onMessageReceived?: (data: any) => void): Promise<void> {
        if (onMessageReceived) {
            this.messageCallback = onMessageReceived;
        }
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

        // Set timeout cho connection
        this.connectionTimeout = setTimeout(() => {
            if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
                const errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
                console.error('WebSocket connection timeout');
                store.dispatch(socketConnectionError(errorMsg));

                if (this.rejectConnection) {
                    this.rejectConnection(new Error(errorMsg));
                }

                // Close socket nếu đang pending
                if (this.socket) {
                    this.socket.close();
                }
            }
        }, CONNECTION_TIMEOUT);

        this.socket = new WebSocket(SOCKET_URL);

        this.socket.onopen = () => {
            // Clear timeout
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }

            // Reset retry count on successful connection
            this.retryCount = 0;
            // Reset reconnect attempts
            this.reconnectAttempts = 0;

            // Dispatch Redux action
            store.dispatch(socketConnected());

            this.messageCallback({status: 'Connected to server'});

            // Start heartbeat to keep connection alive
            this.startHeartbeat();

            // Resolve Promise khi connection ready
            if (this.resolveConnection) {
                this.resolveConnection();
            }
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Xử lý response và dispatch Redux actions tự động
                this.handleServerResponse(data);

                // Gọi callback nếu có
                this.messageCallback(data);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket Error:', error);

            // Clear timeout
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }

            const errorMsg = 'Lỗi kết nối WebSocket. Vui lòng thử lại.';
            store.dispatch(socketConnectionError(errorMsg));

            if (this.rejectConnection) {
                this.rejectConnection(new Error(errorMsg));
            }
        };

        this.socket.onclose = (event) => {
            console.log('🔌 WebSocket closed:', event.code, event.reason);

            // Stop heartbeat
            this.stopHeartbeat();

            // Clear timeout
            if (this.connectionTimeout) {
                clearTimeout(this.connectionTimeout);
                this.connectionTimeout = null;
            }

            // Dispatch Redux action
            store.dispatch(socketDisconnected());

            this.connectionReady = null;
            this.resolveConnection = null;
            this.rejectConnection = null;

            // Auto-reconnect nếu được bật và chưa vượt quá số lần thử
            if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                this.reconnectAttempts++;
                console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

                setTimeout(() => {
                    this.attemptReconnect();
                }, RECONNECT_DELAY);
            } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.error('Max reconnection attempts reached');
                store.dispatch(socketConnectionError('Không thể kết nối lại sau nhiều lần thử. Vui lòng tải lại trang.'));
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
                    console.log('✅ Login/Relogin success, code:', reLoginCode);
                    // Gọi lấy danh sách user NGAY SAU KHI LOGIN HOẶC RELOGIN THÀNH CÔNG
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
                    console.log('Register success');
                    this.getUserList();
                    break;

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        store.dispatch(setUserList(responseData));
                        console.log('✅ Đã nhận danh sách user:', responseData.map((u: any) => u.name).join(', '));
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
            console.error('Server error:', errorMessage);

            // Xử lý đặc biệt khi hết hạn đăng nhập
            if (errorMessage === 'User not Login') {
                console.warn('⚠️ Server báo chưa đăng nhập. Đang tự động đăng nhập lại...');
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
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat() {
        // Clear existing interval nếu có
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        // Gửi ping message mỗi 30s
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                try {
                    this.send({
                        event: 'PING'
                    });
                    console.log('Heartbeat sent');
                } catch (error) {
                    console.error('Failed to send heartbeat:', error);
                }
            }
        }, HEARTBEAT_INTERVAL);
    }

    /**
     * Stop heartbeat
     */
    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    /**
     * Attempt to reconnect and re-login if user was authenticated
     */
    private async attemptReconnect() {
        try {
            await this.connect();

            // Auto re-login nếu có credentials
            const username = localStorage.getItem('username');
            const reLoginCode = localStorage.getItem('reLoginCode');

            if (username && reLoginCode) {
                console.log('🔐 Auto re-login after reconnect...');
                this.reLogin(username, reLoginCode);
            }
        } catch (error) {
            console.error('Failed to reconnect:', error);
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
        // Đợi connection ready nếu đang kết nối
        if (this.connectionReady) {
            await this.connectionReady;
        }

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
        // Đợi connection ready nếu đang kết nối
        if (this.connectionReady) {
            await this.connectionReady;
        }

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
        // Disable auto-reconnect trước khi logout
        this.shouldReconnect = false;

        // Chỉ gửi LOGOUT event nếu socket đã kết nối
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.send({
                event: 'LOGOUT'
            });
        } else {
            // Nếu socket chưa kết nối, chỉ log warning, không throw error
            console.warn('Socket not connected, skipping LOGOUT event');
        }

        // Re-enable reconnect sau khi logout (cho lần login tiếp theo)
        // Nhưng user sẽ cần login lại manually
        setTimeout(() => {
            this.shouldReconnect = true;
            this.reconnectAttempts = 0;
        }, 1000);
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
     * Reconnect to WebSocket server
     */
    reconnect(): Promise<void> {
        if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
            const errorMsg = `Không thể kết nối sau ${MAX_RETRY_ATTEMPTS} lần thử. Vui lòng kiểm tra kết nối mạng và thử lại sau.`;
            store.dispatch(socketConnectionError(errorMsg));
            return Promise.reject(new Error(errorMsg));
        }

        this.retryCount++;

        // Disconnect existing connection if any
        this.disconnect();

        // Try to connect again
        return this.connect();
    }
}

export const socketService = new SocketService();