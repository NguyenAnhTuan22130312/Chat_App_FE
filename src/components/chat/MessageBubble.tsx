import React from 'react';


interface MessageBubbleProps {
 text: string;
 isMe: boolean;
 avatar?: string;
}


export default function MessageBubble({ text, isMe, avatar }: MessageBubbleProps) {
 return (
   <div className={`flex items-end mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>


     {!isMe && (
       <img
         src={avatar}
         alt="avatar"
         className="w-8 h-8 rounded-full mr-2 mb-1"
       />
     )}
    
     <div
       className={`max-w-[70%] px-4 py-2 rounded-2xl text-[15px] leading-5 ${
         isMe
           ? 'bg-[#0084ff] text-white rounded-br-none'
           : 'bg-[#e4e6eb] text-black rounded-bl-none'
       }`}
     >
       {text}
     </div>
   </div>
 );
}
	
