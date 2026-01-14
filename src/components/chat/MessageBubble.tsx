import React from 'react';
import {replaceEmojiShortcodes} from '../../utils/emojiShortcodes';
import {COLOR_MAP} from '../../constants/colors';

interface MessageBubbleProps {
    text: string;
    isMe: boolean;
    avatar?: string;
    timestamp?: string;
    hasAvatarPlaceholder?: boolean;
    senderName?: string;
}

const MessageBubble = ({text, isMe, avatar,timestamp,hasAvatarPlaceholder,senderName}: MessageBubbleProps) => {
    const isImageUrl = (url: string) => {
        if (!url) return false;
        const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
        const isKnownImageHost = url.startsWith('http') && (
            url.includes('cloudinary.com') ||
            url.includes('imgur.com') ||
            url.includes('giphy.com') ||
            url.includes('blob:')
        );

        return hasImageExtension || isKnownImageHost;
    };

    const parseMessage = (text: string) => {

        if (isImageUrl(text)) {
            return {type: 'image', content: text};
        }

        const hasMarkdown = /\*\*|\*|__/.test(text);
        const hasEmoji = /:.+?:/.test(text);
        const hasColor = /\[red]|\[blue]|\[green]|\[yellow]|\[purple]|\[orange]|\[pink]|\[brown]|\[gray]|\[black]/.test(text);

        if (hasMarkdown || hasEmoji || hasColor) {
            let parsed = text;

            // chuyển đổi emoji shortcode thành emoji
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

        // Bold: **text**
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic: *text*
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Underline: __text__
        html = html.replace(/__(.+?)__/g, '<u>$1</u>');

        return <span dangerouslySetInnerHTML={{__html: html}} className="whitespace-pre-wrap"/>;
    };

    const message = parseMessage(text);
    const isImage = message.type === 'image';

    return (

        <div className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>

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
                <div
                    className={`
                        relative z-10 pointer-events-auto text-[15px] leading-relaxed break-words overflow-hidden
                        ${isImage ? 'p-0 bg-transparent' : (
                        isMe
                            ? 'px-3 py-2 bg-[#0084ff] text-white rounded-2xl rounded-tr-md' 
                            : 'px-3 py-2 bg-[#e4e6eb] dark:bg-gray-700 text-black dark:text-white rounded-2xl rounded-tl-md'
                    )}
                    `}
                >
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
        </div>
    );;
};

export default React.memo(MessageBubble);
