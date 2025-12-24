export const THEME = {
    colors: {
      primary: '#0084ff',       
      online: '#44b700',        
      error: '#fa3e3e',
      
      // Login Colors
      loginBanner: '#000851',      // Navy blue for login banner
      loginBannerText: '#ffffff',  // White text on banner
      loginAccent: '#5c6bc0',      // Light blue/purple for decorations
      loginCircle: 'rgba(255, 255, 255, 0.1)', // Semi-transparent circles
      loginFormBg: '#ffffff',      // White background for form
      
      // Light Mode
      light: {
        background: '#ffffff',
        surface: '#f5f5f5',    
        textPrimary: '#050505',
        textSecondary: '#65676b',
        bubbleFriend: '#e4e6eb',
        border: '#dbdbdb',
      },
  
      // Dark Mode 
      dark: {
        background: '#18191a',
        surface: '#3a3b3c',
        textPrimary: '#e4e6eb',
        textSecondary: '#b0b3b8',
        bubbleFriend: '#3a3b3c',
        border: '#3e4042',
      }
    },
  colors: {
    // Các màu dùng chung
    primary: '#0084ff',        // Xanh Messenger sáng
    loginNavy: '#002C77',      // Xanh Navy đậm 
    online: '#44b700',        
    error: '#fa3e3e',
    white: '#ffffff',
    
    // Chế độ sáng
    light: {
      background: '#ffffff',
      surface: '#f5f5f5',      // Màu nền Search Bar & Hover
      textPrimary: '#050505',  // Tên người dùng, Tiêu đề chính
      textSecondary: '#65676b',// Tin nhắn phụ, thời gian
      textLink: '#0064D2',     // Màu cho "forgot password?"
      bubbleFriend: '#e4e6eb',
      border: '#dbdbdb',       // Đường kẻ chia giữa các hội thoại
      inputBorder: '#e0e0e0',  // Border của ô nhập liệu Login
    }
  },
  
  // Khoảng cách 
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    paddingInline: '12px',
    headerHeight: '60px',
    sidebarWidth: '360px', // Độ rộng cột bên trái
  },

  // Cỡ chữ theo tỉ lệ Messenger
  fontSize: {
    small: '12px',    // Thời gian, subtext
    medium: '14px',   // Nội dung tin nhắn cuối
    large: '17px',    // Tên người dùng
    xl: '24px',       // Chữ "Login", "Messenger"
    banner: '48px',   // Chữ "Hello!" to ở banner
  },

  borderRadius: {
      sm: '4px',
      md: '8px',      // Cho ô Input Login
      lg: '20px',     // Cho Search Bar
      xl: '30px',     // Cho Button Login
      full: '50%',    // Cho Avatar
  }
};