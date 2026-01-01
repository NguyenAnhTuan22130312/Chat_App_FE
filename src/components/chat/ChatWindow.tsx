import React from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { MOCK_MESSAGES } from '../../data/mockData';


export default function ChatWindow() {
 return (
   <div className="flex flex-col h-screen bg-white w-full border-l border-gray-300">
     <ChatHeader />


     <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-1">
       {MOCK_MESSAGES.map((msg) => (
         <MessageBubble
           key={msg.id}
           text={msg.text}
           isMe={msg.isMe}
           avatar={msg.avatar}
         />
       ))}
     </div>


     <ChatInput />
   </div>
 );
}

