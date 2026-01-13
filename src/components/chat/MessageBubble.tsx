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
        // mb-1: Khoảng cách nhỏ giữa các tin cùng nhóm
        <div className={`flex items-end mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>

            {/* --- CỘT AVATAR (BÊN TRÁI) --- */}
            {!isMe && (
                <div className="w-8 h-8 mr-2 shrink-0 flex items-start">
                    {/* Chỉ hiện ảnh nếu có avatar (tức là tin đầu tiên) */}
                    {avatar ? (
                        <img
                            src={avatar || "https://via.placeholder.com/32"}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        // Nếu không phải tin đầu, render khoảng trống để thẳng hàng
                        <div className="w-8 h-8" />
                    )}
                </div>
            )}

            {/* --- BONG BÓNG CHAT --- */}
            <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* --- MỚI: HIỂN THỊ TÊN NGƯỜI GỬI TRONG GROUP --- */}
                {senderName && (
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 mb-1 font-medium select-none">
                        {senderName}
                    </span>
                )}
                <div
                    className={`
                        relative text-[15px] leading-relaxed break-words overflow-hidden
                        ${isImage ? 'p-0 bg-transparent' : (
                        isMe
                            ? 'px-3 py-2 bg-[#0084ff] text-white rounded-2xl rounded-tr-md' // Bo góc kiểu tin nhắn liên tiếp
                            : 'px-3 py-2 bg-[#e4e6eb] dark:bg-gray-700 text-black dark:text-white rounded-2xl rounded-tl-md'
                    )}
                        ${/* Tùy chỉnh bo góc cho đẹp hơn nếu muốn:
                           Tin đầu: rounded-2xl
                           Tin giữa: rounded-md
                           Tin cuối: rounded-br-none / rounded-bl-none
                           (Hiện tại mình để bo tròn chung cho đơn giản)
                        */ ''}
                    `}
                >
                    {/* NỘI DUNG TIN NHẮN */}
                    <div className={timestamp ? "mb-1" : ""}>
                        {/* Nếu có timestamp thì margin bottom xíu cho đỡ dính */}
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

                    {/* --- TIMESTAMP NẰM TRONG KHUNG --- */}
                    {timestamp && !isImage && (
                        <div className={`text-[10px] text-right leading-none select-none mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {timestamp}
                        </div>
                    )}
                </div>

                {/* Trường hợp đặc biệt: Nếu là ảnh thì timestamp nên nằm ngoài một chút hoặc đè lên ảnh (tùy chọn).
                    Ở đây mình để timestamp riêng nếu là ảnh để tránh vỡ layout ảnh */}
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
