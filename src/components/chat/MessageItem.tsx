import React, { memo } from 'react';
import MessageBubble from './MessageBubble';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { savePinnedMessageToFirebase } from '../../services/firebaseConfig';
import { formatMessageTime, formatSeparatorTime } from '../../utils/dateUtils';
import { setReplyingTo } from '../../store/slices/uiSlice';

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
    const dispatch = useAppDispatch();
    
    // Logic Avatar
    const specificUserAvatar = useUserAvatar(msg.name);
    const finalAvatar = chatType === 'room' ? specificUserAvatar : partnerAvatarFallback;
    

    const handlePin = () => {
        if (currentChatName && user?.username) {
            savePinnedMessageToFirebase(user.username, currentChatName, msg);
        }
    };

    const handleReply = () => {
        if (currentChatName) {
            dispatch(setReplyingTo({
                target: currentChatName,
                message: msg,
            }));
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
                    <MessageBubble
                        text={msg.mes}
                        isMe={isMe}
                        timestamp={isLastInGroup ? formatMessageTime(msg.createAt) : undefined}
                        senderName={undefined}
                        replyTo={msg.replyTo}
                        onReply={handleReply}
                        onPin={handlePin}
                    />
                </div>
            </div>
        </div>
    );
});

export default MessageItem;