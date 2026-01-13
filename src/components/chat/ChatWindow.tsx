import React, {useEffect, useRef} from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import {useAppSelector} from '../../hooks/reduxHooks';
import {socketService} from '../../services/socketService';
import {useUserAvatar} from '../../hooks/useUserAvatar';

const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';

    // Fix lỗi múi giờ server trả về thiếu 'Z'
    let isoTime = dateString;
    if (!isoTime.endsWith('Z')) {
        isoTime = isoTime + 'Z';
    }

    const date = new Date(isoTime);
    // Lấy giờ và phút, thêm số 0 ở đầu nếu < 10 (ví dụ 9:5 -> 09:05)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
};

export default function ChatWindow() {
    const {user, isAuthenticated} = useAppSelector((state) => state.auth);
    const myUsername = user?.username;
    const messagesByTarget = useAppSelector((state) => state.chat.messagesByTarget);
    const {name: currentChatName, type: currentChatType} = useAppSelector((state) => state.currentChat);
    const messages = currentChatName ? (messagesByTarget[currentChatName] || []) : [];
    const messagesEndRef = useRef<HTMLDivElement>(null);
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
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    if (!currentChatName) {
        return (
            <div
                className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700 items-center justify-center text-gray-400 dark:text-gray-500">
                Chọn một cuộc hội thoại để bắt đầu
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-screen bg-white dark:bg-gray-900 w-full border-l border-gray-300 dark:border-gray-700">
            <ChatHeader/>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-0.5">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 dark:text-gray-500 mt-10">
                        Bắt đầu cuộc trò chuyện với {currentChatName}...
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMe = msg.name === myUsername;

                    // --- SỬA LOGIC TẠI ĐÂY ---

                    // 1. Logic Avatar: Kiểm tra xem đây có phải là tin ĐẦU TIÊN của nhóm không?
                    // (Là tin đầu nếu: Không có tin trước đó HOẶC tin trước đó là của người khác)
                    const prevMsg = messages[index - 1];
                    const isFirstInGroup = !prevMsg || prevMsg.name !== msg.name;

                    // 2. Logic Timestamp: Kiểm tra xem đây có phải là tin CUỐI CÙNG của nhóm không?
                    // (Là tin cuối nếu: Không có tin tiếp theo HOẶC tin tiếp theo là của người khác)
                    const nextMsg = messages[index + 1];
                    const isLastInGroup = !nextMsg || nextMsg.name !== msg.name;

                    return (
                        <MessageBubble
                            key={index}
                            text={msg.mes}
                            isMe={isMe}

                            // 3. Avatar chỉ truyền khi: Không phải tôi VÀ Là tin đầu nhóm
                            avatar={(!isMe && isFirstInGroup) ? partnerAvatar : undefined}

                            // 4. Placeholder (để thẳng hàng): Không phải tôi VÀ KHÔNG phải tin đầu nhóm
                            hasAvatarPlaceholder={!isMe && !isFirstInGroup}

                            // 5. Timestamp chỉ truyền khi: Là tin cuối nhóm
                            timestamp={isLastInGroup ? formatMessageTime(msg.createAt) : undefined}
                        />
                    );
                })}
                <div ref={messagesEndRef}/>
            </div>
            <ChatInput/>
        </div>
    );
}