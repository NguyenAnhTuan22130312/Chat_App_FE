# Chat App Project

> **Note**: Đây là dự án Front-end xây dựng bằng **React + TypeScript**, kết nối Real-time qua Socket API của thầy.

---

## Kiến trúc Dự án (Frontend Structure)

Dự án được tổ chức theo mô hình **Component-Based**, phân tách rõ ràng giữa logic giao diện và logic kết nối Socket.

| Thư mục | Chức năng |
| :--- | :--- |
| `src/services` | Quản lý kết nối WebSocket tập trung. |
| `src/components` | Các thành phần nguyên tử (Atomic UI) như Avatar, Message Bubble. |
| `src/screens` | Chứa các trang lớn: Login, Register, Home Chat. |
| `src/constants` | Lưu trữ Theme (màu sắc) và các Event Names của Socket. |

---

##  Tài liệu Socket API 

Ứng dụng kết nối tới Server qua URL: `wss://chat.longapp.site/chat/chat`

### Xác thực & Tài khoản
- `REGISTER`: Đăng ký tài khoản.
- `LOGIN`: Đăng nhập lần đầu.
- `RE_LOGIN`: Tự động kết nối lại bằng mã code lưu ở LocalStorage.
- `LOGOUT`: Thoát hệ thống.

### Chức năng Nhắn tin
- `SEND_CHAT`: Gửi tin nhắn (Hỗ trợ `type: "people"` và `type: "room"`).
- `GET_USER_LIST`: Lấy danh sách người dùng để bắt đầu hội thoại.
- `CHECK_USER`: Kiểm tra thông tin người dùng.
- `CREATE_ROOM` & `JOIN_ROOM`: Quản lý nhóm chat.
- `GET_PEOPLE_CHAT_MES`: Tải lịch sử tin nhắn cá nhân.

---

## Danh sách Công việc (Roadmap)

### Giai đoạn 1: Nền tảng
- [x] Thiết lập Theme & Cấu trúc thư mục.
- [ ] Xây dựng giao diện Đăng ký / Đăng nhập.
- [ ] Code Service kết nối Socket (`SocketService.ts`).

### Giai đoạn 2: Tính năng cốt lõi
- [ ] Render danh sách bạn bè từ `GET_USER_LIST`.
- [ ] Gửi/Nhận tin nhắn Text thời gian thực.
- [ ] Hiển thị lịch sử chat từ API.

### Giai đoạn 3: Tính năng nâng cao
- [ ] **Rich Text**: Nhận diện in đậm, in nghiêng, in hoa.
- [ ] **Media**: Gửi hình ảnh, Video, GIF.
- [ ] **UI/UX**: Emoji picker, hiệu ứng tin nhắn đang soạn.

---

## Hướng dẫn chạy Project

1. **Cài đặt thư viện:**
   ```bash
   npm install
Chạy ở chế độ Development:
```bash
   npm start
