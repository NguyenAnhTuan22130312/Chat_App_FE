import React from 'react';
import { ChatMessage } from '../../store/slices/chatSlice';
import { truncateMessage } from '../../utils/replyUtils';
import { replaceEmojiShortcodes } from '../../utils/emojiShortcodes';

interface ReplyPreviewProps {
    message: ChatMessage;
    onClose: () => void;
}

export default function ReplyPreview({ message, onClose }: ReplyPreviewProps) {
    // Kiểm tra xem tin nhắn có phải là hình ảnh không
    const isImage = message.mes.startsWith('http') && /\.(jpeg|jpg|gif|png|webp)$/i.test(message.mes);
    
    // Xử lý nội dung hiển thị
    const displayContent = isImage 
        ? 'Hình ảnh'
        : truncateMessage(replaceEmojiShortcodes(message.mes), 60);

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {/* Left border accent */}
            <div className="w-1 h-10 bg-blue-500 rounded-full flex-shrink-0" />
            
            {/* Reply content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <svg 
                        className="w-4 h-4 text-blue-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" 
                        />
                    </svg>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Trả lời {message.name}
                    </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {displayContent}
                </p>
            </div>

            {/* Close button */}
            <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Hủy reply"
            >
                <svg 
                    className="w-5 h-5 text-gray-500 dark:text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                    />
                </svg>
            </button>
        </div>
    );
}
