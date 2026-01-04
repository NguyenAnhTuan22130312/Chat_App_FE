// src/components/chat/ChatInput.tsx
import React, { useState } from 'react';
import { socketService } from '../../services/socketService';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { addMessage } from '../../store/slices/chatSlice';

export default function ChatInput() {
  const [text, setText] = useState('');
  const { currentPartner } = useAppSelector(state => state.chat);
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  const handleSend = async () => {
    if (!text.trim()) return;

    const tempMessage = {
      name: user?.username || 'me',
      mes: text,
      to: currentPartner,
      createAt: new Date().toISOString()
  };
    dispatch(addMessage(tempMessage));

    try {
      await socketService.connect();

      socketService.sendMessageToPeople(currentPartner, text);
      setText('');
      
    } catch (error) {
      console.error("Không thể gửi tin nhắn:", error);
      alert("Mất kết nối tới máy chủ, vui lòng thử lại!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
      e.preventDefault();
    }
  };

  return (
    <div className="h-[60px] border-t border-gray-300 flex items-center px-4 bg-white">
      {/* Các icon bên trái giữ nguyên... */}
      <div className="flex space-x-3 text-gray-500 mr-3">
         {/* ... svg icons ... */}
      </div>

      <div className="flex-1 relative">
        <input 
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..." 
          className="w-full bg-gray-100 rounded-full py-2 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer">☺</span>
      </div>

      {/* Nút gửi (Thay icon Like bằng nút Gửi cho trực quan hoặc bắt sự kiện click vào icon Like để gửi cũng được) */}
      <div className="ml-3 text-[#0084ff] cursor-pointer" onClick={handleSend}>
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v7.333l-2 2z" /></svg>
      </div>
    </div>
  );
}
