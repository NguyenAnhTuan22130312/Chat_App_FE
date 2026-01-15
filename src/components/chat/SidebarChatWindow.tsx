import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useFirebaseLists } from '../../hooks/useFirebaseLists';
import {
    inviteUserToGroup,
    subscribeToChatImages,
    hideGroup,
    blockUser
} from '../../services/friendService';
import { socketService } from '../../services/socketService';
import { clearCurrentChat } from '../../store/slices/currentChatSlice'; // Import action xóa chat hiện tại
import ConfirmModal from '../common/ConfirmModal'; // Import Confirm Modal

// --- COMPONENT THÀNH VIÊN ---
const MemberItem = ({ name }: { name: string }) => {
    const avatar = useUserAvatar(name);
    return (
        <div className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer transition-colors">
            <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
        </div>
    );
};

// --- COMPONENT MỜI BẠN BÈ ---
const AddMemberItem = ({ name, onAdd }: { name: string, onAdd: () => void }) => {
    const avatar = useUserAvatar(name);
    return (
        <div className="flex items-center justify-between p-2 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors group">
            <div className="flex items-center gap-2 overflow-hidden">
                <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{name}</span>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Mời vào nhóm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
        </div>
    );
}

// --- COMPONENT CHÍNH ---
const SidebarChatWindow = () => {
    const dispatch = useAppDispatch();

    // Lấy thông tin chat và USERLIST từ Redux
    const { name: currentName, type, userList } = useAppSelector((state) => state.currentChat as any);
    const currentUser = useAppSelector((state) => state.auth.user?.username || '');
    const avatar = useUserAvatar(currentName || '');

    const { friends } = useFirebaseLists(currentUser);

    // States
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [mediaImages, setMediaImages] = useState<string[]>([]);

    // State cho Modal Xem Ảnh (Lightbox)
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // State cho Modal Xác Nhận (Block/Hide)
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean; title: string; message: string; isDanger?: boolean; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', isDanger: false, onConfirm: () => {} });

    // --- 1. LẤY ẢNH TỪ FIREBASE ---
    useEffect(() => {
        if (currentName && currentUser && type) {
            const unsubscribe = subscribeToChatImages(currentName, currentUser, type, (urls) => {
                setMediaImages(urls);
            });
            return () => unsubscribe();
        } else {
            setMediaImages([]);
        }
    }, [currentName, currentUser, type]);

    // --- 2. LỌC BẠN ĐỂ MỜI ---
    const eligibleFriends = friends.filter(friendName => {
        if (!userList) return true;
        return !userList.some((member: any) => member.name === friendName);
    });

    // --- CÁC HÀM XỬ LÝ (HANDLERS) ---

    const handleInvite = async (targetFriend: string) => {
        if (!currentUser || !currentName) return;
        try {
            await inviteUserToGroup(targetFriend, currentName, currentUser);
            socketService.sendMessageToPeople(targetFriend, `Mình đã mời bạn vào nhóm ${currentName}`);
            alert(`Đã gửi lời mời tới ${targetFriend}`);
            setShowAddMember(false);
        } catch (error) { alert("Lỗi: " + error); }
    };

    // Hàm mở Modal Xác nhận
    const openConfirm = (title: string, message: string, action: () => void, isDanger = false) => {
        setModalConfig({
            isOpen: true, title, message, isDanger,
            onConfirm: async () => {
                await action();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Xử lý Ẩn Nhóm
    const handleHideGroup = () => {
        if (!currentUser || !currentName) return;
        openConfirm(
            "Ẩn nhóm chat?",
            `Bạn có chắc muốn ẩn nhóm "${currentName}"? Nhóm sẽ chuyển vào mục lưu trữ.`,
            async () => {
                await hideGroup(currentUser, currentName);
                dispatch(clearCurrentChat()); // Đóng khung chat sau khi ẩn
            }
        );
    };

    // Xử lý Chặn Người dùng
    const handleBlockUser = () => {
        if (!currentUser || !currentName) return;
        openConfirm(
            "Chặn người dùng?",
            `Bạn có chắc chắn muốn chặn ${currentName}? Bạn sẽ không nhận được tin nhắn từ họ nữa.`,
            async () => {
                await blockUser(currentUser, currentName);
                dispatch(clearCurrentChat()); // Đóng khung chat sau khi chặn
            },
            true // Màu đỏ
        );
    };

    if (!currentName) return null;

    return (
        <div className="w-[300px] h-full border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 relative">

            {/* --- HEADER --- */}
            <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-gray-800">
                <img src={avatar} alt={currentName} className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-gray-800 mb-3 shadow-sm" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center truncate w-full">{currentName}</h2>
                <p className="text-sm text-gray-500 capitalize">{type === 'room' ? 'Nhóm trò chuyện' : 'Cá nhân'}</p>

                {/* NÚT THÊM THÀNH VIÊN (ROOM ONLY) */}
                {type === 'room' && (
                    <div className="mt-4 w-full relative">
                        {!showAddMember ? (
                            <button
                                onClick={() => setShowAddMember(true)}
                                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl transition-colors text-sm font-semibold"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                Thêm thành viên
                            </button>
                        ) : (
                            <div className="animate-in fade-in zoom-in duration-200 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Mời bạn bè</span>
                                    <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                                    {eligibleFriends.length > 0 ? (
                                        eligibleFriends.map(friend => (
                                            <AddMemberItem key={friend} name={friend} onAdd={() => handleInvite(friend)} />
                                        ))
                                    ) : (
                                        <p className="text-xs text-center text-gray-400 py-2">Không còn bạn bè nào.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- TÌM KIẾM TIN NHẮN --- */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tìm kiếm tin nhắn</h3>
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="Nhập từ khóa..."
                        className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
            </div>

            {/* --- DANH SÁCH THÀNH VIÊN (FIX BUG KHÔNG HIỆN) --- */}
            {type === 'room' && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thành viên</h3>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300 font-bold">
                            {userList ? userList.length : 0}
                        </span>
                    </div>
                    {/* Render UserList: Kiểm tra kỹ userList có tồn tại không */}
                    <div className="max-h-40 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                        {userList && userList.length > 0 ? (
                            userList.map((u: any, idx: number) => (
                                // u.name là tên user
                                <MemberItem key={idx} name={u.name} />
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic">Đang tải thành viên...</p>
                        )}
                    </div>
                </div>
            )}

            {/* --- MEDIA (FIX BUG CLICK VÀO ẢNH) --- */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-1">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ảnh đã chia sẻ</h3>
                    <span className="text-xs text-gray-400">{mediaImages.length} ảnh</span>
                </div>

                {mediaImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {mediaImages.map((url, i) => (
                            <div
                                key={i}
                                onClick={() => setPreviewImage(url)} // BẤM VÀO ĐỂ MỞ MODAL XEM ẢNH
                                className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-all border border-gray-200 dark:border-gray-700 active:scale-95"
                            >
                                <img src={url} alt="media" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-xs text-gray-400">Chưa có ảnh nào.</p>
                    </div>
                )}
            </div>

            {/* --- ACTIONS (FIX LOGIC BUTTON) --- */}
            <div className="p-4 mt-auto bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-2">
                    {/* Nút Ẩn Nhóm (Room) */}
                    {type === 'room' && (
                        <button
                            onClick={handleHideGroup}
                            className="w-full flex items-center gap-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-600 group"
                        >
                            <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                            </div>
                            <span className="font-medium text-sm">Ẩn nhóm này</span>
                        </button>
                    )}

                    {/* Nút Chặn Người (People) */}
                    {type === 'people' && (
                        <button
                            onClick={handleBlockUser}
                            className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100 group"
                        >
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </div>
                            <span className="font-medium text-sm">Chặn người này</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- MODAL XEM ẢNH FULL (LIGHTBOX) --- */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)} // Bấm ra ngoài để đóng
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
                        onClick={() => setPreviewImage(null)}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <img
                        src={previewImage}
                        alt="Full Preview"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // Bấm vào ảnh không đóng
                    />
                </div>
            )}

            {/* --- MODAL XÁC NHẬN --- */}
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                onConfirm={modalConfig.onConfirm}
                onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default SidebarChatWindow;