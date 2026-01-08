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
  const { messages, currentPartner } = useAppSelector((state) => state.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const partnerAvatar = useUserAvatar(currentPartner);

  useEffect(() => {
    const initChat = async () => {
      await socketService.connect();

      if (myUsername && currentPartner && isAuthenticated) {
        setTimeout(() => {
           socketService.getHistory(currentPartner);
        }, 500);
      }
    };
    initChat();
  }, [currentPartner, myUsername, isAuthenticated]);

    // useEffect(() => {
    //     if (!myUsername || !currentPartner || !isAuthenticated) return;
    //
    //     socketService
    //         .connect()
    //         .then(() => {
    //             socketService.getHistory(currentPartner);
    //         })
    //         .catch((err) => {
    //             console.error('Không thể kết nối socket:', err);
    //         });
    //
    //     return () => {
    //         socketService.disconnect();
    //     };
    // }, [currentPartner, myUsername, isAuthenticated]);



    useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

 return (
   <div className="flex flex-col h-screen bg-white w-full border-l border-gray-300">
     <ChatHeader />
     <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1">
     {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
                Bắt đầu cuộc trò chuyện với {currentPartner}...
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