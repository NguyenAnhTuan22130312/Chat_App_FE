import React, { useMemo } from 'react';
import { useAppSelector } from '../../hooks/reduxHooks';

interface ChatHeaderProps {
   onCallClick?: () => void;
}


export default function ChatHeader({ onCallClick }: ChatHeaderProps) {
   const { name, type } = useAppSelector((state) => state.currentChat);
   const { partners } = useAppSelector((state) => state.chatPartner);
   const currentPartner = useMemo(() => {
       return partners.find(p => p.name === name);
   }, [partners, name]);


   let statusText = '';
   let dotColor = '';


   if (type === 'room') {
       statusText = 'Nhóm và Cộng đồng';
       dotColor = 'bg-orange-500';
   } else {
       if (currentPartner?.isOnline) {
           statusText = 'Đang hoạt động';
           dotColor = 'bg-green-500';
       } else {
           statusText = 'Không hoạt động';
           dotColor = 'bg-gray-400';
       }
   }


   return (
       <div className="h-[60px] border-b border-gray-300 dark:border-gray-700 flex items-center justify-between px-4 bg-white dark:bg-gray-800 shadow-sm relative">


           <div className="flex flex-col items-center w-full">
               <h2 className="text-[17px] font-bold text-gray-900 dark:text-white truncate max-w-[300px]">
                   {name || "Chọn hội thoại"}
               </h2>


               {name && (
                   <span className="text-[13px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                       <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>

                       <span className="font-medium">{statusText}</span>
           </span>
               )}
           </div>


           <div className="absolute right-4 flex space-x-3 text-[#0084ff] dark:text-blue-400">
               <button onClick={onCallClick} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
               </button>


               <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
               </button>
           </div>
       </div>
   );
}

