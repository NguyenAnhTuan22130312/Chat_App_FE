import React from 'react';

interface MessageBubbleProps {
  text: string;
  isMe: boolean;
  avatar?: string;
}

export default function MessageBubble({ text, isMe, avatar }: MessageBubbleProps) {
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

  const isImage = isImageUrl(text);

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
                : 'px-4 py-2 bg-[#e4e6eb] text-black rounded-bl-none'
              )
        }`}
      >
        {isImage ? (
          <img 
            src={text} 
            alt="Sent content" 
            onClick={() => window.open(text, '_blank')}
            className={`
              block max-w-full h-auto max-h-[350px] object-contain cursor-pointer
              border border-gray-200 hover:opacity-95 transition-opacity
              ${isMe ? 'rounded-2xl rounded-br-none' : 'rounded-2xl rounded-bl-none'}
            `}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerText = text; 
                e.currentTarget.parentElement!.className += isMe ? ' bg-[#0084ff] text-white px-4 py-2' : ' bg-[#e4e6eb] text-black px-4 py-2';
            }}
          />
        ) : (
          <span className="whitespace-pre-wrap">{text}</span>
        )}
      </div>
    </div>
  );
}