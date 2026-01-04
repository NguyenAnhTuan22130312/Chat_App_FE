import {
  loginFailure,
  loginSuccess,
  registerSuccess,
  socketConnected,
  socketDisconnected,
  socketConnectionError
} from "../store/slices/authSlice";
import {store} from "../store/store";

const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';
const CONNECTION_TIMEOUT = 30000; // 30s
const MAX_RETRY_ATTEMPTS = 3;

class SocketService {
  private socket: WebSocket | null = null;
  private messageCallback: (data: any) => void = () => {};
  private connectionReady: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;
  private rejectConnection: ((error: Error) => void) | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private retryCount: number = 0;

  /**
   * kết nối tới web socket
   * @param onMessageReceived - callback nhận message từ server (dùng cho custom handling)
   */
  connect(onMessageReceived?: (data: any) => void): Promise<void> {
    if (onMessageReceived) {
      this.messageCallback = onMessageReceived;
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
      
      // Dispatch Redux action
      store.dispatch(socketConnected());
      
      this.messageCallback({ status: 'Connected to server' });
      
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

    this.socket.onclose = () => {
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
    };

    return this.connectionReady;
  }

  /**
   * Xử lý response từ server và dispatch Redux actions tương ứng
   */
  private handleServerResponse(data: any) {
    // Kiểm tra event type từ server
    const event = data.event;
    const status = data.status;

    if (status === 'success') {
      switch (event) {
        case 'LOGIN':
        case 'RE_LOGIN':
          //Login succes
              const  reLoginCode = data.data?.RE_LOGIN_CODE;
              const username = localStorage.getItem('username') || '';

              store.dispatch(loginSuccess({
                user: { username },
                reLoginCode: reLoginCode,
              }));
              break;

        case 'REGISTER':
          // register success
              store.dispatch(registerSuccess());
              break;

        default:
          // Các event khác (chat, vv...)
          break;
      }
    } else if (status === 'error') {
      // Xử lý error
      const errorMessage = data.mes || 'Có lỗi xảy ra';

      if (event === 'LOGIN' || event === 'RE_LOGIN' || event === 'REGISTER') {
        store.dispatch(loginFailure(errorMessage));
      }
      console.error('Server error:', errorMessage);
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
    // Chỉ gửi LOGOUT event nếu socket đã kết nối
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        event: 'LOGOUT'
      });
    } else {
      // Nếu socket chưa kết nối, chỉ log warning, không throw error
      console.warn('Socket not connected, skipping LOGOUT event');
    }
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
    if (this.socket) {
      this.socket.close();
    }
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