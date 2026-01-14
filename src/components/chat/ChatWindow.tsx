import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { parseDate } from "../../utils/dateUtils";
import { setMessages } from '../../store/slices/chatSlice';
import { useWebRTC } from '../../hooks/useWebRTC';
import VideoCallModal from './VideoCallModal';


const GROUPING_THRESHOLD_MINUTES = 10;
const SEPARATOR_THRESHOLD_HOURS = 1;


export default function ChatWindow() {
   const dispatch = useAppDispatch();
   const { user, isAuthenticated } = useAppSelector((state) => state.auth);
   const myUsername = user?.username;
   const messagesByTarget = useAppSelector((state) => state.chat.messagesByTarget);
   const { name: currentChatName, type: currentChatType } = useAppSelector((state) => state.currentChat);
   const messages = currentChatName ? (messagesByTarget[currentChatName] || []) : [];


   // --- REFS ---
   const messagesEndRef = useRef<HTMLDivElement>(null);
   const scrollContainerRef = useRef<HTMLDivElement>(null);
   const scrollHeightRef = useRef<number>(0);
   const lastMessageIdRef = useRef<string | null>(null);
   const loadSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);


   // --- STATES ---
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);


   const currentChatAvatar = useUserAvatar(currentChatName || '');


   // --- WEBRTC HOOK ---
   const {
       localStream,
       remoteStream,
       isCalling,
       isIncoming,
       callStatus,
       startCall,
       answerCall,
       endCall
   } = useWebRTC(currentChatName || '');


   // 1. RESET KHI ĐỔI CHAT
   useEffect(() => {
       if (isAuthenticated && currentChatName && currentChatType) {
           setPage(1);
           setHasMore(true);
           setIsLoadingMore(false);
           scrollHeightRef.current = 0;
           lastMessageIdRef.current = null;
           if (loadSafetyTimerRef.current) clearTimeout(loadSafetyTimerRef.current);


           dispatch(setMessages({ target: currentChatName, messages: [] }));


           const timer = setTimeout(() => {
               if (currentChatType === 'room') {
                   socketService.getRoomHistory(currentChatName || '', 1);
               } else {
                   socketService.getHistory(currentChatName || '', 1);
               }
           }, 50);
           return () => {
               clearTimeout(timer);
           };
       }
   }, [currentChatName, currentChatType, isAuthenticated, dispatch]);


   // 2. XỬ LÝ SCROLL
   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
       const { scrollTop, scrollHeight } = e.currentTarget;


       if (scrollTop === 0 && hasMore && !isLoadingMore && messages.length > 0) {
           console.log(` Requesting Page ${page + 1}...`);
           scrollHeightRef.current = scrollHeight;
           setIsLoadingMore(true);


           if (loadSafetyTimerRef.current) clearTimeout(loadSafetyTimerRef.current);
           loadSafetyTimerRef.current = setTimeout(() => {
               console.warn("⚠ Load timer expired. Server returned empty or timed out.");
               setIsLoadingMore(false);
               setHasMore(false);
           }, 2000);


           const nextPage = page + 1;
           setPage(nextPage);


           if (currentChatType === 'room') {
               socketService.getRoomHistory(currentChatName || '', nextPage);
           } else {
               socketService.getHistory(currentChatName || '', nextPage);
           }
       }
   };


   // 3. FIX NHẢY LUNG TUNG & TẮT LOADING KHI THÀNH CÔNG
   useLayoutEffect(() => {
       if (isLoadingMore && scrollContainerRef.current) {
           if (loadSafetyTimerRef.current) clearTimeout(loadSafetyTimerRef.current);


           const container = scrollContainerRef.current;
           const newScrollHeight = container.scrollHeight;
           const diff = newScrollHeight - scrollHeightRef.current;


           if (diff > 0) {
               console.log(` Restoring scroll: pushed down ${diff}px`);
               container.scrollTop = diff;
           }


           setIsLoadingMore(false);
       }
   }, [messages]);


   // 4. AUTO SCROLL BOTTOM
   useEffect(() => {
       if (messages.length === 0) return;
       const lastMsg = messages[messages.length - 1];
       const lastMsgId = lastMsg.id || (lastMsg.createAt + lastMsg.mes);


       if (lastMsgId !== lastMessageIdRef.current) {
           if (!isLoadingMore) {
               messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
           }
           lastMessageIdRef.current = lastMsgId;
       }
   }, [messages, isLoadingMore]);




   if (!currentChatName) {
       return (
           <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700 items-center justify-center text-gray-400 dark:text-gray-500">
               Chọn một cuộc hội thoại để bắt đầu
           </div>
       );
   }


   return (
       <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700 relative">
           <ChatHeader onCallClick={startCall} />


           <div
               ref={scrollContainerRef}
               onScroll={handleScroll}
               className="flex-1 overflow-y-auto p-4 flex flex-col space-y-0.5 custom-scrollbar relative"
           >
               {isLoadingMore && (
                   <div className="flex justify-center py-2 w-full shrink-0 my-2">
                       <div className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-full shadow-sm">
                           <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                       </div>
                   </div>
               )}


               {messages.length === 0 && !isLoadingMore && (
                   <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                       Bắt đầu cuộc trò chuyện với {currentChatName}...
                   </div>
               )}


               {messages.map((msg, index) => {
                   const isMe = msg.name === myUsername;
                   const prevMsg = messages[index - 1];
                   const nextMsg = messages[index + 1];


                   const currentTime = parseDate(msg.createAt).getTime();
                   const prevTime = prevMsg ? parseDate(prevMsg.createAt).getTime() : 0;
                   const nextTime = nextMsg ? parseDate(nextMsg.createAt).getTime() : 0;


                   const diffFromPrevMinutes = prevMsg ? (currentTime - prevTime) / (1000 * 60) : 0;
                   const diffToNextMinutes = nextMsg ? (nextTime - currentTime) / (1000 * 60) : 0;


                   let showTimeSeparator = false;
                   if (!prevMsg || diffFromPrevMinutes >= SEPARATOR_THRESHOLD_HOURS * 60) {
                       showTimeSeparator = true;
                   }


                   const isFirstInGroup = !prevMsg ||
                       prevMsg.name !== msg.name ||
                       showTimeSeparator ||
                       diffFromPrevMinutes > GROUPING_THRESHOLD_MINUTES;


                   const isLastInGroup = !nextMsg ||
                       nextMsg.name !== msg.name ||
                       diffToNextMinutes > GROUPING_THRESHOLD_MINUTES;


                   return (
                       <MessageItem
                           key={msg.id || index}
                           msg={msg}
                           isMe={isMe}
                           isFirstInGroup={isFirstInGroup}
                           isLastInGroup={isLastInGroup}
                           showTimeSeparator={showTimeSeparator}
                           chatType={currentChatType}
                           partnerAvatarFallback={currentChatAvatar}
                       />
                   );
               })}
               <div ref={messagesEndRef}/>
           </div>
           <ChatInput/>


           {/* MODAL VIDEO CALL */}
           {(isCalling || isIncoming) && (
               <VideoCallModal
                   localStream={localStream}
                   remoteStream={remoteStream}
                   isIncoming={isIncoming}
                   onAnswer={answerCall}
                   onEnd={endCall}
                   status={callStatus}
                   partnerName={currentChatName || 'Unknown'}
               />
           )}
       </div>
   );
}

