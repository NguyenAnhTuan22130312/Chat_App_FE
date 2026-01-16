import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { setCurrentChat } from '../../store/slices/currentChatSlice';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useMemo } from 'react';
import { replaceEmojiShortcodes } from '../../utils/emojiShortcodes';
import { clearUnread } from "../../store/slices/unreadSlice";
import { formatSeparatorTime } from '../../utils/dateUtils';

interface ChatListProps {
    searchQuery: string;
}

const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';

    let isoTime = dateString;
    if (!isoTime.endsWith('Z')) {
        isoTime = isoTime + 'Z';
    }

    const date = new Date(isoTime);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) return 'Vừa xong';
    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày`;

    return `${date.getDate()}/${date.getMonth() + 1}`;
};

const ChatList = ({ searchQuery }: ChatListProps) => {
    const dispatch = useAppDispatch();
    const { partners } = useAppSelector((state) => state.chatPartner);
    const currentChat = useAppSelector((state) => state.currentChat);
    const currentUsername = useAppSelector((state) => state.auth.user?.username || '');

    const filteredPartners = useMemo(() => {
        return partners
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.name !== currentUsername)
            .sort((a, b) => (b.actionTime || 0) > (a.actionTime || 0) ? 1 : -1);
    }, [partners, searchQuery, currentUsername]);

    return (
        <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            {filteredPartners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 4-8-4" /></svg>
                    <p className="text-xs font-medium">Không tìm thấy hội thoại</p>
                </div>
            ) : (
                filteredPartners.map((partner) => (
                    <ChatListItem
                        key={`${partner.type}-${partner.name}`}
                        partner={partner}
                        isActive={currentChat.name === partner.name}
                        onClick={() => {
                            dispatch(setCurrentChat({ name: partner.name, type: partner.type }));
                            dispatch(clearUnread(partner.name));
                        }}
                    />
                ))
            )}
        </div>
    );
};

const ChatListItem = ({ partner, isActive, onClick }: any) => {
    const avatar = useUserAvatar(partner.name, partner.type);
    const currentUsername = useAppSelector((state) => state.auth.user?.username);
    const unreadCount = useAppSelector(state => state.unread.unreadCounts[partner.name] || 0);
    const shouldBold = !isActive && unreadCount > 0;

    const messagesByTarget = useAppSelector((state) => state.chat.messagesByTarget);
    const messages = messagesByTarget[partner.name] || [];
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

    const timeDisplay = lastMsg?.createAt
        ? formatTimeAgo(lastMsg.createAt)
        : formatTimeAgo(partner.actionTime);

    let previewText = partner.type === 'people' ? 'Chưa có tin nhắn' : 'Phòng chưa có tin nhắn';

    if (lastMsg) {
        const msgContent = lastMsg.mes;
        const isImage = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(msgContent) ||
            msgContent.includes('cloudinary.com') ||
            msgContent.startsWith('blob:');

        if (isImage) {
            const isMe = lastMsg.name === currentUsername;
            previewText = isMe ? 'Bạn đã gửi một ảnh' : '📷 Đã gửi một ảnh';
        } else {
            const isMe = lastMsg.name === currentUsername;
            let prefix = '';

            if (isMe) {
                prefix = 'Bạn: ';
            } else if (partner.type === 'room') {
                prefix = `${lastMsg.name}: `;
            }

            let cleanContent = msgContent;


            cleanContent = cleanContent.replace(/\*\*\*(@\w+)\*\*\*/g, '$1');

            previewText = prefix + cleanContent;

            if (previewText.length > 30) {
                previewText = previewText.substring(0, 30) + '...';
            }

            previewText = replaceEmojiShortcodes(previewText);
        }
    }

    return (
        <div
            onClick={onClick}
            className={`group relative flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 ${
                isActive
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
            <div className="relative shrink-0">
                {partner.type === 'people' ? (
                    <img src={avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${isActive ? 'border-white/20' : 'border-transparent'}`} alt="" />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50'}`}>
                        {partner.name.charAt(0).toUpperCase()}
                    </div>
                )}
                {partner.type === 'people' && (
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${isActive ? 'border-blue-600' : 'border-white dark:border-gray-900'} ${partner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">

                    <p className={`text-sm truncate mr-2 ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'} ${shouldBold ? 'font-extrabold' : 'font-bold'}`}>
                        {partner.name}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                        {timeDisplay && (
                            <span className={`text-[12px] whitespace-nowrap ${isActive ? 'text-blue-100' : (shouldBold ? 'text-blue-600 font-bold' : 'text-gray-400')}`}>
                                {timeDisplay}
                            </span>
                        )}

                        {shouldBold ? (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        ) : (
                            isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                    </div>
                </div>

                <p className={`text-xs truncate font-medium 
                    ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}
                    ${shouldBold && !isActive ? 'text-gray-900 dark:text-white font-bold' : ''} 
                `}>
                    {previewText}
                </p>
            </div>
        </div>
    );
};

export default ChatList;