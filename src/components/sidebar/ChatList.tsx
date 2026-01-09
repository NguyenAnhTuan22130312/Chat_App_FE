import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { setCurrentChat } from '../../store/slices/currentChatSlice';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useMemo } from 'react';
import { clearUnread } from "../../store/slices/unreadSlice"; // Import action mới

const ChatList = ({ searchQuery }: any) => {

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
                // ... (Giữ nguyên UI rỗng)
                <p className="text-center text-gray-500 mt-4">Trống</p>
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
    const dispatch = useAppDispatch();

    // 1. Lấy số lượng tin chưa đọc từ store mới
    const unreadCounts = useAppSelector((state) => state.unread.unreadCounts);
    const unreadCount = unreadCounts[partner.name] || 0;
    const hasUnread = unreadCount > 0;

    let previewText = partner.type === 'people' ? 'Nhắn tin cá nhân' : 'Phòng cộng đồng';

    if (lastMsg) {
        const msg = lastMsg.message;
        const isImage = /\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i.test(msg) ||
            msg.includes('cloudinary.com') ||
            msg.startsWith('blob:');

        if (isImage) {
            previewText = '📷 Đã gửi một ảnh';
        } else {
            const isMe = lastMsg.senderName === currentUsername;
            previewText = (isMe ? 'Bạn: ' : (lastMsg.senderName ? `${lastMsg.senderName}: ` : '')) + msg;
        }
    }

    const handleClick = () => {
        // Nếu đang có tin chưa đọc thì clear khi click vào
        if (hasUnread) {
            dispatch(clearUnread(partner.name));
        }
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex items-center gap-3 p-3 cursor-pointer rounded-2xl transition-all duration-200 select-none ${
                isActive
                    ? 'bg-blue-600 shadow-lg shadow-blue-500/20'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                {partner.type === 'people' ? (
                    <img src={avatar} className={`w-12 h-12 rounded-full object-cover border-2 ${isActive ? 'border-white/20' : 'border-transparent'}`} alt="" />
                ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50'}`}>
                        {partner.name.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Online Dot */}
                {partner.type === 'people' && (
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 ${isActive ? 'border-blue-600' : 'border-white dark:border-gray-900'} ${partner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                )}
            </div>

            {/* Nội dung text */}
            <div className="flex-1 min-w-0 pr-6"> {/* pr-6 để chừa chỗ cho badge số lượng */}
                <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`text-sm truncate ${
                        isActive ? 'text-white font-bold' : 'text-gray-900 dark:text-white font-bold'
                    }`}>
                        {partner.name}
                    </p>
                </div>

                {/* LOGIC MÀU CHỮ:
                    - Nếu Active: Màu trắng nhạt
                    - Nếu Chưa đọc: Màu đen (gray-900) + Đậm (font-bold)
                    - Bình thường: Màu xám (gray-500) + Thường (font-medium)
                */}
                <p className={`text-xs truncate transition-colors ${
                    isActive
                        ? 'text-blue-100 font-medium'
                        : hasUnread
                            ? 'text-gray-900 dark:text-white font-bold' // Chưa đọc -> ĐEN ĐẬM
                            : 'text-gray-500 dark:text-gray-400 font-medium' // Đã đọc -> Xám
                }`}>
                    {previewText}
                </p>
            </div>

            {/* Badge số tin chưa đọc - Đặt bên phải cùng, căn giữa theo chiều dọc */}
            {hasUnread && !isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatList;