export const THEME = {
  colors: {
    // --- Các màu dùng chung ---
    primary: '#0084ff',        // Xanh Messenger sáng
    online: '#44b700',
    error: '#fa3e3e',
    white: '#ffffff',

    // --- Login Colors (Chi tiết) ---
    loginBanner: '#000851',      // Navy blue cho banner
    loginBannerText: '#ffffff',  // Chữ trắng trên banner
    loginAccent: '#5c6bc0',      // Màu trang trí
    loginCircle: 'rgba(255, 255, 255, 0.1)', // Hình tròn mờ
    loginFormBg: '#ffffff',      // Nền form
    loginNavy: '#002C77',        // Xanh Navy đậm (giữ lại từ block 2 phòng khi bạn cần dùng)

    // --- Modern Gradient Colors ---
    gradientPurpleStart: '#667eea',
    gradientPurpleEnd: '#764ba2',
    gradientPinkStart: '#f093fb',
    gradientPinkEnd: '#f5576c',
    gradientBlueStart: '#4facfe',
    gradientBlueEnd: '#00f2fe',
    
    // --- Glassmorphism Colors ---
    glassBackground: 'rgba(255, 255, 255, 0.15)',
    glassBorder: 'rgba(255, 255, 255, 0.25)',
    glassBackgroundDark: 'rgba(255, 255, 255, 0.05)',

    // --- Chế độ sáng (Light Mode) ---
    light: {
      background: '#ffffff',
      surface: '#f5f5f5',      // Màu nền Search Bar & Hover
      textPrimary: '#050505',  // Tên người dùng, Tiêu đề chính
      textSecondary: '#65676b',// Tin nhắn phụ, thời gian
      textLink: '#0064D2',     // Màu link "forgot password"
      bubbleFriend: '#e4e6eb', // Bong bóng chat bạn bè
      border: '#dbdbdb',       // Đường kẻ chia
      inputBorder: '#e0e0e0',  // Viền ô nhập liệu
    },

    // --- Chế độ tối (Dark Mode) ---
    dark: {
      background: '#18191a',
      surface: '#3a3b3c',
      textPrimary: '#e4e6eb',
      textSecondary: '#b0b3b8',
      bubbleFriend: '#3a3b3c',
      border: '#3e4042',
      textLink: '#4599ff',     // (Tự động thêm để tương thích với light mode)
      inputBorder: '#3e4042',  // (Tự động thêm để tương thích với light mode)
    }
  },

  // --- Khoảng cách (Spacing) ---
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    paddingInline: '12px',
    headerHeight: '60px',
    sidebarWidth: '360px',
  },

  // --- Cỡ chữ (Font Size) ---
  fontSize: {
    small: '12px',    // Thời gian, subtext
    medium: '14px',   // Nội dung tin nhắn
    large: '17px',    // Tên người dùng
    xl: '24px',       // Tiêu đề lớn
    banner: '48px',   // Chữ Hello banner
  },

  // --- Bo góc (Border Radius) ---
  borderRadius: {
    sm: '4px',
    md: '8px',      // Input Login
    lg: '20px',     // Search Bar
    xl: '30px',     // Button Login
    full: '50%',    // Avatar
  },

  // --- Shadows & Effects ---
  shadows: {
    button: '0 8px 24px rgba(103, 126, 234, 0.3)',
    buttonHover: '0 12px 32px rgba(103, 126, 234, 0.4)',
    form: '0 20px 60px rgba(0, 0, 0, 0.15)',
    input: '0 2px 8px rgba(0, 0, 0, 0.05)',
    inputFocus: '0 0 0 3px rgba(103, 126, 234, 0.1)',
    glow: '0 0 20px rgba(103, 126, 234, 0.5)',
  }
};