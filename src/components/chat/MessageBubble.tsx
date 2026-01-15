import React, { useState, useMemo } from 'react';
import {replaceEmojiShortcodes} from '../../utils/emojiShortcodes';
import {COLOR_MAP} from '../../constants/colors';
import { ChatMessage } from '../../store/slices/chatSlice';
import { truncateMessage, parseReplyMessage } from '../../utils/replyUtils';

interface MessageBubbleProps {
    text: string;
    isMe: boolean;
    avatar?: string;
    timestamp?: string;
    senderName?: string;
    replyTo?: ChatMessage['replyTo'];
    onReply?: () => void;
    onPin?: () => void;
}

const MessageBubble = ({text, isMe, avatar, timestamp, senderName, replyTo, onReply, onPin}: MessageBubbleProps) => {
    const [showActions, setShowActions] = useState(false);

    const { actualText, parsedReplyTo } = useMemo(() => {
        const parsed = parseReplyMessage(text);
        return {
            actualText: parsed.mes,
            parsedReplyTo: parsed.replyTo || replyTo
        };
    }, [text, replyTo]);

    const isImageUrl = (url: string) => {
        if (!url) return false;
        const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
        const isKnownImageHost = url.startsWith('http') && (
            url.includes('cloudinary.com') ||
            url.includes('imgur.com') ||
            url.includes('giphy.com') ||
            url.includes('blob:')
        );
        // Loại trừ nếu nó là audio/video
        if (/\.(mp4|webm|mp3|wav|ogg|m4a)$/i.test(url)) return false;

        return hasImageExtension || isKnownImageHost;
    };

    const isAudioUrl = (url: string) => {
        if (!url || !url.startsWith('http')) return false;
        return /\.(mp3|wav|ogg|webm|m4a)$/i.test(url) || url.includes('/video/upload/'); 
    };

    const parseMessage = (text: string) => {
        if (isImageUrl(text)) {
            return {type: 'image', content: text};
        }
        if (isAudioUrl(text)) {
            return {type: 'audio', content: text};
        }

        const hasMarkdown = /\*\*|\*|__/.test(text);
        const hasEmoji = /:.+?:/.test(text);
        const hasColor = /\[red]|\[blue]|\[green]|\[yellow]|\[purple]|\[orange]|\[pink]|\[brown]|\[gray]|\[black]/.test(text);

        if (hasMarkdown || hasEmoji || hasColor) {
            let parsed = text;
            parsed = replaceEmojiShortcodes(parsed);
            return {type: 'markdown', content: parsed};
        }

        return {type: 'plain', content: text};
    };

    const renderMarkdown = (text: string) => {
        let html = text;

        Object.entries(COLOR_MAP).forEach(([name, hex]) => {
            const regex = new RegExp(`\\[${name}\\](.+?)\\[\\/${name}\\]`, 'g');
            html = html.replace(regex, `<span style="color:${hex}">$1</span>`);
        });

        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/__(.+?)__/g, '<u>$1</u>');

        return <span dangerouslySetInnerHTML={{__html: html}} className="whitespace-pre-wrap"/>;
    };

    const message = parseMessage(actualText);
    const isImage = message.type === 'image';
    const isAudio = message.type === 'audio';
    const bubbleStyle = isImage 
        ? 'p-0 bg-transparent' 
        : isAudio
            ? `p-1.5 ${isMe ? 'bg-[#0084ff]' : 'bg-[#f0f2f5] dark:bg-gray-700'} rounded-2xl`
            : isMe
                ? 'px-3 py-2 bg-[#0084ff] text-white rounded-2xl rounded-tr-md'
                : 'px-3 py-2 bg-[#e4e6eb] dark:bg-gray-700 text-black dark:text-white rounded-2xl rounded-tl-md';

    return (
        <div 
            className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'} group relative`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {!isMe && (
                <div className="w-8 h-8 mr-2 shrink-0 flex items-start">
                    {avatar ? (
                        <img
                            src={avatar || "https://via.placeholder.com/32"}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        <div className="w-8 h-8" />
                    )}
                </div>
            )}

            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {senderName && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 mb-1 font-medium select-none">
                        {senderName}
                    </span>
                )}

                <div className={`relative z-10 pointer-events-auto text-[15px] leading-relaxed break-words overflow-hidden ${bubbleStyle}`}>
                    
                    {parsedReplyTo && !isImage && !isAudio && (
                        <div className={`mb-2 pb-2 border-l-2 pl-2 ${
                            isMe 
                                ? 'border-blue-200 bg-blue-500/20' 
                                : 'border-gray-400 dark:border-gray-500 bg-gray-200 dark:bg-gray-600'
                        } rounded-r`}>
                            <div className={`text-[11px] font-semibold mb-0.5 ${
                                isMe ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                                {parsedReplyTo.senderName}
                            </div>
                            <div className={`text-[13px] ${
                                isMe ? 'text-blue-50' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                                {truncateMessage(replaceEmojiShortcodes(parsedReplyTo.message), 50)}
                            </div>
                        </div>
                    )}

                    <div className={timestamp ? "mb-1" : ""}>
                        {message.type === 'image' ? (
                            <img
                                src={message.content}
                                alt="Sent content"
                                onClick={() => window.open(message.content, '_blank')}
                                className="block max-w-full h-auto max-h-[350px] object-contain cursor-pointer rounded-lg"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerText = message.content;
                                }}
                            />
                        ) : message.type === 'audio' ? (
                            <div className="flex items-center gap-2 min-w-[240px]">
                                <audio 
                                    controls 
                                    className="w-full h-8 rounded-lg outline-none" 
                                    style={{ height: '32px' }}
                                >
                                    <source src={message.content} />
                                    Trình duyệt không hỗ trợ audio.
                                </audio>
                            </div>
                        ) : message.type === 'markdown' ? (
                            renderMarkdown(message.content)
                        ) : (
                            <span className="whitespace-pre-wrap">{message.content}</span>
                        )}
                    </div>

                    {timestamp && !isImage && (
                        <div className={`text-[10px] text-right leading-none select-none mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {timestamp}
                        </div>
                    )}
                </div>

                {timestamp && isImage && (
                    <div className="text-[10px] text-gray-400 mt-1 select-none opacity-80">
                        {timestamp}
                    </div>
                )}
            </div>

            {showActions && onReply && (
                <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex items-center gap-1 px-2`}>
                    <button
                        onClick={onReply}
                        className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-md transition-all"
                        title="Trả lời"
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>

                    {onPin && (
                        <button
                            onClick={onPin}
                            className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-md transition-all"
                            title="Ghim tin nhắn"
                        >
                            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="17" x2="12" y2="22"></line>
                                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                            </svg>
                        </button>
                    )}

                    <button
                        className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-md transition-all"
                        title="Thêm"
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

export default React.memo(MessageBubble);