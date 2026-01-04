import {loginFailure, loginSuccess, registerSuccess} from "../store/slices/authSlice";
import {store} from "../store/store";
import { setUserList } from "../store/slices/userListSlice";
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
    /**
     * Xử lý response từ server và dispatch Redux actions tương ứng
     */
    private handleServerResponse(receivedData: any) {
        console.log('Raw received:', receivedData); // Debug: xem chính xác cấu trúc

        // QUAN TRỌNG: Server luôn bọc trong { action: "onchat", data: { ... } }
        const payload = receivedData.action === 'onchat' ? receivedData.data : receivedData;

        const event = payload.event;
        const status = payload.status;
        const responseData = payload.data;

        console.log('Processed payload:', { event, status, responseData }); // Debug

        if (status === 'success') {
            switch (event) {
                case 'LOGIN':
                case 'RE_LOGIN':
                    const reLoginCode = responseData?.RE_LOGIN_CODE;
                    const username = localStorage.getItem('username') || '';

                    store.dispatch(loginSuccess({
                        user: { username },
                        reLoginCode: reLoginCode,
                    }));
                    console.log('✅ Login/Relogin success, code:', reLoginCode);

                    // Gọi lấy danh sách user NGAY SAU KHI LOGIN HOẶC RELOGIN THÀNH CÔNG
                    this.getUserList();
                    break;

                case 'REGISTER':
                    const registerCode = responseData?.RE_LOGIN_CODE;
                    const registerUser = localStorage.getItem('username') || '';

                    store.dispatch(registerSuccess({
                        user: { username: registerUser },
                        reLoginCode: registerCode,
                    }));
                    console.log('Register success');
                    break;

                case 'GET_USER_LIST':
                    if (Array.isArray(responseData)) {
                        store.dispatch(setUserList(responseData));
                        console.log('✅ Đã nhận danh sách user:', responseData.map((u: any) => u.name).join(', '));
                    } else {
                        console.warn('GET_USER_LIST data không hợp lệ:', responseData);
                    }
                    break;

                default:
                    console.log('Event khác (chat, room,...):', event);
                    break;
            }
        } else if (status === 'error') {
            const errorMessage = payload.mes || 'Có lỗi xảy ra';
            console.error('Server error:', errorMessage);

            if (event === 'LOGIN' || event === 'RE_LOGIN' || event === 'REGISTER') {
                store.dispatch(loginFailure(errorMessage));
            }
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

    // Lấy lịch sử tin nhắn phòng (page bắt đầu từ 1)
    getRoomHistory(roomName: string, page: number = 1) {
        this.send({
            event: 'GET_ROOM_CHAT_MES',
            data: { name: roomName, page }
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