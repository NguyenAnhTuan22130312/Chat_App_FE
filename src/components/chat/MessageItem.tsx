import React, { memo } from 'react';
import MessageBubble from './MessageBubble';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { savePinnedMessageToFirebase } from '../../services/firebaseConfig';
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

    const { name: currentChatName } = useAppSelector(state => state.currentChat);
    const { user } = useAppSelector(state => state.auth);
    
    // Logic Avatar
    const specificUserAvatar = useUserAvatar(msg.name);
    const finalAvatar = chatType === 'room' ? specificUserAvatar : partnerAvatarFallback;
    

    const handlePin = () => {
        if (currentChatName && user?.username) {
            savePinnedMessageToFirebase(user.username, currentChatName, msg,chatType);
        }
    };

    return (
        <div className="flex flex-col w-full px-2">
            {showTimeSeparator && (
                <div className="flex justify-center my-4">
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full select-none">
                        {formatSeparatorTime(msg.createAt)}
                    </span>
                </div>
            )}

            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : 'mt-0.5'}`}>
                {!isMe && (
                    <div className="w-8 flex-shrink-0 mr-2 flex flex-col justify-end">
                         {(!isMe && isFirstInGroup) ? (
                            <img 
                                src={finalAvatar} 
                                alt="avatar" 
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                            />
                        ) : <div className="w-8"/>}
                    </div>
                )}
                <div className={`relative group flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                
                    {(chatType === 'room' && !isMe && isFirstInGroup) && (
                         <span className="text-[11px] text-gray-500 ml-1 mb-1">{msg.name}</span>
                    )}
                    <button
                        onClick={handlePin}
                        className={`
                            absolute top-1/2 -translate-y-1/2 z-20
                            p-1.5 rounded-full shadow-sm border border-gray-200 dark:border-gray-600
                            bg-white dark:bg-gray-700 text-gray-400 hover:text-blue-500
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200
                            ${isMe ? 'right-full mr-2' : 'left-full ml-2'}
                        `}
                        title="Ghim tin nhắn"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                    </button>
                    <MessageBubble
                        text={msg.mes}
                        isMe={isMe}
                        hasAvatarPlaceholder={false} 
                        timestamp={isLastInGroup ? formatMessageTime(msg.createAt) : undefined}
                        senderName={undefined}
                    />
                </div>
            </div>
        </div>
    );
});

export default MessageItem;