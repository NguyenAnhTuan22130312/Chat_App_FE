import React from 'react';
import { replaceEmojiShortcodes } from '../../utils/emojiShortcodes';
import { COLOR_MAP } from '../../constants/colors';

interface MessageBubbleProps {
  text: string;
  isMe: boolean;
  avatar?: string;
}

const MessageBubble = ({ text, isMe, avatar }: MessageBubbleProps) => {
  const isImageUrl = (url: string) => {
    if (!url) return false;
    const hasImageExtension = /\.(jpeg|jpg|gif|png|webp|bmp)$/i.test(url);
    const isKnownImageHost = url.startsWith('http') && (
        url.includes('cloudinary.com') || 
        url.includes('imgur.com') ||
        url.includes('blob:')
    );

    return hasImageExtension || isKnownImageHost;
  };

  const parseMessage = (text: string) => {

    if (isImageUrl(text)) {
      return { type: 'image', content: text };
    }

    const hasMarkdown = /\*\*|\*|__/.test(text);
    const hasEmoji = /:.+?:/.test(text);
    const hasColor = /\[red]|\[blue]|\[green]|\[yellow]|\[purple]|\[orange]|\[pink]|\[brown]|\[gray]|\[black]/.test(text);

    if (hasMarkdown || hasEmoji || hasColor) {
      let parsed = text;
      
      // chuyển đổi emoji shortcode thành emoji
      parsed = replaceEmojiShortcodes(parsed);
      
      return { type: 'markdown', content: parsed };
    }

    return { type: 'plain', content: text };
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

    return <span dangerouslySetInnerHTML={{ __html: html }} className="whitespace-pre-wrap" />;
  };

  const message = parseMessage(text);
  const isImage = message.type === 'image';

  return (
    <div className={`flex items-end mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <img
          src={avatar || "https://via.placeholder.com/32"} 
          alt="avatar"
          className="w-8 h-8 rounded-full mr-2 mb-1 object-cover border border-gray-200"
        />
      )}
      
      <div
        className={`max-w-[70%] rounded-2xl text-[15px] leading-5 break-words overflow-hidden ${
          isImage 
            ? 'p-0 bg-transparent' 
            : (isMe 
                ? 'px-4 py-2 bg-[#0084ff] text-white rounded-br-none' 
                : 'px-4 py-2 bg-[#e4e6eb] dark:bg-gray-700 text-black dark:text-white rounded-bl-none'
              )
        }`}
      >
        {message.type === 'image' ? (
          <img 
            src={message.content} 
            alt="Sent content" 
            onClick={() => window.open(message.content, '_blank')}
            className={`
              block max-w-full h-auto max-h-[350px] object-contain cursor-pointer
              border border-gray-200 hover:opacity-95 transition-opacity
              ${isMe ? 'rounded-2xl rounded-br-none' : 'rounded-2xl rounded-bl-none'}
            `}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerText = message.content; 
                e.currentTarget.parentElement!.className += isMe ? ' bg-[#0084ff] text-white px-4 py-2' : ' bg-[#e4e6eb] text-black px-4 py-2';
            }}
          />
        ) : message.type === 'markdown' ? (
          renderMarkdown(message.content)
        ) : (
          <span className="whitespace-pre-wrap">{message.content}</span>
        )}
      </div>
    </div>
  );
};

export default React.memo(MessageBubble);
