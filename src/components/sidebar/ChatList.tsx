import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { setCurrentChat } from '../../store/slices/currentChatSlice';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useMemo } from 'react';
import { replaceEmojiShortcodes } from '../../utils/emojiShortcodes';

interface ChatListProps {
    searchQuery: string;
}

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
                        isActive={currentChat.name === partner.name && currentChat.type === partner.type}
                        onClick={() => dispatch(setCurrentChat({ name: partner.name, type: partner.type }))}
                    />
                ))
            )}
        </div>
    );
};

const ChatListItem = ({ partner, isActive, onClick }: any) => {
    const avatar = useUserAvatar(partner.type === 'people' ? partner.name : null);
    const lastMsg = useAppSelector((state) => state.lastMessage.messages[partner.name]);
    const currentUsername = useAppSelector((state) => state.auth.user?.username);

    let previewText = partner.type === 'people' ? 'Nhắn tin cá nhân' : 'Phòng cộng đồng';

    if (lastMsg) {
        // Kiểm tra xem tin nhắn có phải là ảnh không
        const msg = lastMsg.message;
        const isImage = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(msg) ||
            msg.includes('cloudinary.com') ||
            msg.startsWith('blob:');

        if (isImage) {
            previewText = '📷 Đã gửi một ảnh';
        } else {
            const isMe = lastMsg.senderName === currentUsername;
            previewText = (isMe ? 'Bạn: ' : (lastMsg.senderName ? `${lastMsg.senderName}: ` : '')) + msg;

            // Cắt ngắn nếu quá dài (tránh tràn layout)
            if (previewText.length > 40) {
                previewText = previewText.substring(0, 37) + '...';
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
            {/* Avatar Section */}
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

            {/* Content Section */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {partner.name}
                    </p>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                </div>
                <p className={`text-xs truncate font-medium ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {previewText}
                </p>
            </div>
        </div>
    );
};

export default ChatList;