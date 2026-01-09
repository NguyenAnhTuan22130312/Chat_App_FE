import React, { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useAppSelector } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import { useUserAvatar } from '../../hooks/useUserAvatar';

export default function ChatWindow() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const myUsername = user?.username;
  
  const { messages } = useAppSelector((state) => state.chat);
  const { name: currentChatName, type: currentChatType } = useAppSelector((state) => state.currentChat);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hook lấy avatar dựa trên tên (người hoặc phòng)
  const partnerAvatar = useUserAvatar(currentChatName || '');

  // Effect: Gọi API lấy lịch sử khi thay đổi chat
  useEffect(() => {
    if (isAuthenticated && currentChatName && currentChatType) {
        // Delay nhẹ để đảm bảo socket sẵn sàng hoặc UI ổn định
        const timer = setTimeout(() => {
            if (currentChatType === 'room') {
                socketService.getRoomHistory(currentChatName);
            } else {
                socketService.getHistory(currentChatName);
            }
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [currentChatName, currentChatType, isAuthenticated]);

  // Effect: Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentChatName) {
      return (
          <div className="flex flex-col h-screen bg-white w-full border-l border-gray-300 items-center justify-center text-gray-400">
              Chọn một cuộc hội thoại để bắt đầu
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-white w-full border-l border-gray-300">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">
            Bắt đầu cuộc trò chuyện với {currentChatName}...
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isMe = msg.name === myUsername;
          return (
            <MessageBubble
              key={index}
              text={msg.mes}
              isMe={isMe}
              avatar={!isMe ? partnerAvatar : undefined}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput />
    </div>
  );
}