import React, {useEffect, useRef, memo} from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import {useAppSelector} from '../../hooks/reduxHooks';
import {socketService} from '../../services/socketService';
import {useUserAvatar} from '../../hooks/useUserAvatar';
import {parseDate} from "../../utils/dateUtils";
import MessageItem from "./MessageItem";

// --- CONSTANTS & HELPERS (Giữ nguyên) ---
const GROUPING_THRESHOLD_MINUTES = 10;
const SEPARATOR_THRESHOLD_HOURS = 1;

export default function ChatWindow() {
    const {user, isAuthenticated} = useAppSelector((state) => state.auth);
    const myUsername = user?.username;
    const messagesByTarget = useAppSelector((state) => state.chat.messagesByTarget);
    const {name: currentChatName, type: currentChatType} = useAppSelector((state) => state.currentChat);
    const messages = currentChatName ? (messagesByTarget[currentChatName] || []) : [];
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Avatar này chỉ đúng cho chat 1-1, hoặc là avatar của chính cái Room (chứ ko phải member)
    const currentChatAvatar = useUserAvatar(currentChatName || '');

    useEffect(() => {
        if (isAuthenticated && currentChatName && currentChatType) {
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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    if (!currentChatName) {
        return (
            <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700 items-center justify-center text-gray-400 dark:text-gray-500">
                Chọn một cuộc hội thoại để bắt đầu
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700">
            <ChatHeader/>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-0.5">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                        Bắt đầu cuộc trò chuyện với {currentChatName}...
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.name === myUsername;
                    const prevMsg = messages[index - 1];
                    const nextMsg = messages[index + 1];

                    // --- Tính toán logic hiển thị ở Component cha ---
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

                    // --- Render qua Component con ---
                    return (
                        <MessageItem
                            key={index}
                            msg={msg}
                            isMe={isMe}
                            isFirstInGroup={isFirstInGroup}
                            isLastInGroup={isLastInGroup}
                            showTimeSeparator={showTimeSeparator}
                            chatType={currentChatType} // Truyền type xuống để biết là room hay people
                            partnerAvatarFallback={currentChatAvatar} // Truyền avatar gốc xuống (dùng cho people)
                        />
                    );
                })}
                <div ref={messagesEndRef}/>
            </div>
            <ChatInput/>
        </div>
    );
}