const SOCKET_URL = 'wss://chat.longapp.site/chat/chat';

class SocketService {
  private socket: WebSocket | null = null;
  private messageCallback: (data: any) => void = () => {};

  // kết nối tới web socket
  connect(onMessageReceived: (data: any) => void) {
    this.messageCallback = onMessageReceived;
    this.socket = new WebSocket(SOCKET_URL);

    this.socket.onopen = () => {
      console.log('WebSocket Connected');
      this.messageCallback({ status: 'Connected to server' });
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        this.messageCallback(data);
      } catch (error) {
        console.error('Errormessage', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket Closed');
    };
  }

  // hàm on chat chung
  private send(payload: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({
        action: 'onchat',
        data: payload
      });
      console.log('Sending:', message);
      this.socket.send(message);
    } else {
      console.log('Socket not connected');
    }
  }


  // đăng ký
  register(user: string, pass: string) {
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
    this.send({
      event: 'LOGIN',
      data: {
        user: user,
        pass: pass
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