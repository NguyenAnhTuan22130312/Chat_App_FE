import {loginFailure, loginSuccess, registerSuccess} from "../store/slices/authSlice";
import { addMessage, setMessages } from "../store/slices/chatSlice";
import {store} from "../store/store";

const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';

class SocketService {
  private socket: WebSocket | null = null;
  private messageCallback: (data: any) => void = () => {};
  private connectionReady: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;

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
    this.connectionReady = new Promise((resolve) => {
      this.resolveConnection = resolve;
    });

    this.socket = new WebSocket(SOCKET_URL);

    this.socket.onopen = () => {
      console.log('WebSocket Connected');
      this.messageCallback({ status: 'Connected to server' });
      
      // Resolve Promise khi connection ready
      if (this.resolveConnection) {
        this.resolveConnection();
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);

        // Xử lý response và dispatch Redux actions tự động
        this.handleServerResponse(data);

        // Gọi callback nếu có
        this.messageCallback(data);
      } catch (error) {
        console.error('Errormessage', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket Closed');
      this.connectionReady = null;
      this.resolveConnection = null;
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
              console.log('Login success, RE_LOGIN_CODE:', reLoginCode);
              break;

        case 'REGISTER':
          // register success
              const registerCode = data.data?.RE_LOGIN_CODE;
              const registerUser = localStorage.getItem('username') || '';

              store.dispatch(registerSuccess({
                user: { username: registerUser },
                reLoginCode: registerCode,
              }));
              console.log('Register success');
              break;
              case "GET_PEOPLE_CHAT_MES":
                const historyData = data.data;
                console.log("Server trả về lịch sử chat raw:", historyData);
                if (Array.isArray(data.data)) {
                  const sortedMessages = [...historyData].reverse();
                   store.dispatch(setMessages(data.data));
                   
                   console.log("Đã tải lịch sử chat:", data.data.length, "tin nhắn");
                }
                break;
      
              case "SEND_CHAT":
                if (data.data) {
                  store.dispatch(addMessage(data.data));
                }
                break;

        default:
          // Các event != (chat, vv...)
          break;
      }
    } else if (status === 'error') {
      // Xử lý error
      const errorMessage = data.mes || 'Có lỗi xảy ra';

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

      if (event === 'LOGIN' || event === 'RE_LOGIN' || event === 'REGISTER') {
        store.dispatch(loginFailure(errorMessage));
      }
      console.error('server error:', errorMessage)
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
      console.log('Sending:', message);
      this.socket.send(message);
    } else {
      console.error('Socket not conected');
      throw new Error('WebSocket chưa kết nối');
    }
  }



  // đăng ký
  register(user: string, pass: string) {
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
  login(user: string, pass: string) {
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
}

export const socketService = new SocketService();