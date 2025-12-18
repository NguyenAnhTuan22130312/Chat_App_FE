import React from 'react';
import { THEME } from './constants/Theme';

function App() {
  const theme = THEME.colors.light;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw',
      backgroundColor: theme.background 
    }}>
      
      {/* {anh em code danh sách chat chỗ này} */}
      <aside style={{ 
        width: THEME.spacing.sidebarWidth, 
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '16px', fontSize: THEME.fontSize.xl, fontWeight: 'bold' }}>
          Đoạn chat
        </div>
        {/* {code danh sách tin nhắn ở đây nhé} */}
      </aside>

      {/* {ô chat chính} */}
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {/* {nội dung chat} */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: theme.textSecondary }}>Chọn một cuộc trò chuyện để bắt đầu</p>
        </div>
      </main>

    </div>
  );
}

export default App;