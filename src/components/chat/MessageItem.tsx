// src/components/chat/MessageItem.tsx (Ví dụ đường dẫn)

import React, { memo } from 'react';
import MessageBubble from './MessageBubble';
import { useUserAvatar } from '../../hooks/useUserAvatar'; // Chỉnh lại đường dẫn hook cho đúng
// Import các hàm xử lý thời gian
import { formatMessageTime, formatSeparatorTime } from '../../utils/dateUtils';

const MessageItem = memo(({
                              msg,
                              isMe,
                              isFirstInGroup,
                              isLastInGroup,
                              showTimeSeparator,
                              chatType,
                              partnerAvatarFallback
                          }: any) => {

    // Logic Avatar: Chat Room thì lấy theo tên người gửi, Chat 1-1 thì lấy fallback
    const specificUserAvatar = useUserAvatar(msg.name);
    const finalAvatar = chatType === 'room' ? specificUserAvatar : partnerAvatarFallback;

    return (
        <React.Fragment>
            {/* 1. Line ngăn cách thời gian */}
            {showTimeSeparator && (
                <div className="flex justify-center my-4">
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full select-none">
                        {formatSeparatorTime(msg.createAt)}
                    </span>
                </div>
            )}

            {/* 2. Bong bóng chat */}
            <MessageBubble
                text={msg.mes}
                isMe={isMe}
                avatar={(!isMe && isFirstInGroup) ? finalAvatar : undefined}
                hasAvatarPlaceholder={!isMe && !isFirstInGroup}
                timestamp={isLastInGroup ? formatMessageTime(msg.createAt) : undefined}
                senderName={(chatType === 'room' && !isMe && isFirstInGroup) ? msg.name : undefined}
            />
        </React.Fragment>
    );
});

export default MessageItem; // <-- QUAN TRỌNG: Phải export ra mới dùng được