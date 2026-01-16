import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { listenForPinnedMessages, removePinnedMessageFromFirebase } from '../../services/firebaseConfig';
import { setPinnedMessage } from '../../store/slices/chatSlice';

export default function PinnedMessageBar() {
    const dispatch = useAppDispatch();

    const { name: currentChatName, type: currentChatType } = useAppSelector((state) => state.currentChat);
    const { user } = useAppSelector((state) => state.auth);

    const pinnedMessage = useAppSelector((state) => 
        currentChatName ? state.chat.pinnedMessages[currentChatName] : null
    );

    useEffect(() => {
        if (!currentChatName || !user?.username || !currentChatType) return;
        const unsubscribe = listenForPinnedMessages(
            user.username, 
            currentChatName, 
            currentChatType, 
            (message) => {
                dispatch(setPinnedMessage({ 
                    target: currentChatName, 
                    message: message 
                }));
            }
        );
        return () => unsubscribe();
    }, [currentChatName, currentChatType, user, dispatch]);

    const handleUnpin = () => {
        if (currentChatName && user?.username && currentChatType) {
            removePinnedMessageFromFirebase(user.username, currentChatName, currentChatType);
        }
    };

    if (!pinnedMessage || !currentChatName) return null;

    return (
        <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-700/50 px-4 py-2 flex items-center justify-between shadow-sm z-10">
            <div className="flex flex-col overflow-hidden mr-2">
                <div className="text-[11px] font-bold text-yellow-700 dark:text-yellow-500 uppercase flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06zm-5 5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                        <path d="M14.25 2.25L16.5 4.5 19.5 1.5 22.5 4.5 19.5 7.5l2.25 2.25-2.25 2.25L14.25 7.5 12 5.25 9.75 7.5 7.5 5.25 9.75 3l4.5-4.5z" /> 
                    </svg>
                    Tin nhắn đã ghim
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200 truncate mt-0.5">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 mr-1">
                        {pinnedMessage.name}:
                    </span>
                    {pinnedMessage.mes}
                </div>
            </div>

            <button 
                onClick={handleUnpin}
                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-gray-500 dark:text-gray-400"
                title="Bỏ ghim"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
    );
}