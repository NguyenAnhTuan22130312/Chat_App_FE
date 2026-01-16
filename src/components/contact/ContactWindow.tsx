import React, { useState } from 'react';
import { useAppSelector } from '../../hooks/reduxHooks';
import { useFirebaseLists } from '../../hooks/useFirebaseLists';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import {
    acceptFriendRequest,
    rejectFriendRequest,
    blockUser,
    unblockUser,
    hideGroup,
    unhideGroup,
    acceptGroupInvite,
    rejectGroupInvite
} from '../../services/friendService';
import { socketService } from '../../services/socketService';
import ConfirmModal from '../common/ConfirmModal'; // Import Modal mới

// --- 1. COMPONENT CARD (Giữ nguyên) ---
const UserCard = ({ username, subText, actions }: { username: string, subText?: string, actions: React.ReactNode }) => {
    const avatar = useUserAvatar(username);
    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <img src={avatar} alt={username} className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-base">{username}</h3>
                    {subText && <p className="text-xs text-gray-500">{subText}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2">{actions}</div>
        </div>
    );
};

// --- 2. COMPONENT CHÍNH ---
const ContactWindow = () => {
    const currentUser = useAppSelector((state) => state.auth.user?.username);
    const activeTab = useAppSelector((state) => state.ui.activeContactTab);
    const { friends, groups, friendRequests, groupInvites, blocks, hiddenGroups } = useFirebaseLists(currentUser);

    // --- STATE QUẢN LÝ MODAL ---
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        isDanger?: boolean;
        onConfirm: () => void;
    }>({
        isOpen: false, title: '', message: '', isDanger: false, onConfirm: () => {}
    });

    const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

    // --- HÀM HELPER ĐỂ MỞ MODAL ---
    const openConfirm = (title: string, message: string, action: () => void, isDanger = false) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            isDanger,
            onConfirm: async () => {
                await action();
                closeModal();
            }
        });
    };

    const handleAcceptGroup = async (groupName: string) => {
        if (!currentUser) return;
        try {
            await acceptGroupInvite(currentUser, groupName);
             socketService.joinRoom(groupName);
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleRejectGroup = (groupName: string) => {
        if (!currentUser) return;
        openConfirm(
            "Từ chối tham gia nhóm?",
            `Bạn có chắc muốn từ chối lời mời vào nhóm ${groupName}?`,
            () => rejectGroupInvite(currentUser, groupName),
            true // Nút màu đỏ
        );
    };

    // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG (Dùng openConfirm thay vì window.confirm) ---

    const handleAcceptFriend = async (target: string) => {
        if (!currentUser) return;
        try {
            await acceptFriendRequest(currentUser, target);
            socketService.sendMessageToPeople(target, "oke ban");
        } catch (error: any) {
            // Có thể dùng Modal thông báo lỗi ở đây thay alert nếu muốn xịn hơn
            alert(error.message);
        }
    };

    const handleRejectFriend = (target: string) => {
        if (!currentUser) return;
        openConfirm(
            "Từ chối kết bạn?",
            `Bạn có chắc chắn muốn xóa lời mời từ ${target}?`,
            () => rejectFriendRequest(currentUser, target),
            true // Danger action
        );
    };

    const handleBlock = (target: string) => {
        if (!currentUser) return;
        openConfirm(
            "Chặn người dùng?",
            `Bạn có chắc chắn muốn chặn ${target}? Họ sẽ không thể nhắn tin cho bạn nữa.`,
            () => blockUser(currentUser, target),
            true
        );
    };

    const handleUnblock = (target: string) => {
        if (!currentUser) return;
        openConfirm(
            "Bỏ chặn?",
            `Cho phép ${target} liên lạc lại với bạn?`,
            () => unblockUser(currentUser, target)
        );
    };

    const handleHideGroup = (groupName: string) => {
        if (!currentUser) return;
        openConfirm(
            "Ẩn nhóm chat?",
            `Nhóm ${groupName} sẽ bị ẩn khỏi danh sách chat chính. Bạn có thể tìm lại trong mục "Nhóm đã ẩn".`,
            () => hideGroup(currentUser, groupName)
        );
    };

    const handleUnhideGroup = async (groupName: string) => {
        if (!currentUser) return;
        try {
            await unhideGroup(currentUser, groupName);
        } catch (error: any) {
            alert(error.message);
        }
    };

    // --- RENDER NỘI DUNG (Giữ nguyên logic cũ, chỉ gọi hàm handle...) ---
    const renderContent = () => {
        switch (activeTab) {
            case 'friends':
                if (friends.length === 0) return <EmptyState text="Chưa có bạn bè nào." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {friends.map(friend => (
                            <UserCard key={friend} username={friend} subText="Bạn bè"
                                      actions={
                                          <button onClick={() => handleBlock(friend)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-semibold transition-colors">Chặn</button>
                                      }
                            />
                        ))}
                    </div>
                );

            case 'groups':
                if (groups.length === 0) return <EmptyState text="Chưa tham gia nhóm nào." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {groups.map(group => (
                            <UserCard key={group} username={group} subText="Nhóm chat"
                                      actions={
                                          <button onClick={() => handleHideGroup(group)} className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Ẩn
                                          </button>
                                      }
                            />
                        ))}
                    </div>
                );
            case 'groupInvites':
                if (groupInvites.length === 0) return <EmptyState text="Không có lời mời vào nhóm nào." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {groupInvites.map((invite: any) => (
                            <UserCard
                                key={invite.group}
                                username={invite.group} // Hiển thị Tên Nhóm
                                subText={`Người mời: ${invite.inviter}`} // Hiển thị người mời
                                actions={
                                    <>
                                        <button
                                            onClick={() => handleRejectGroup(invite.group)}
                                            className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleAcceptGroup(invite.group)}
                                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
                                        >
                                            Tham gia
                                        </button>
                                    </>
                                }
                            />
                        ))}
                    </div>
                );

            case 'friendRequests':
                if (friendRequests.length === 0) return <EmptyState text="Không có lời mời kết bạn nào." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {friendRequests.map(req => (
                            <UserCard key={req} username={req} subText="Muốn kết bạn với bạn"
                                      actions={
                                          <>
                                              <button onClick={() => handleRejectFriend(req)} className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors">Xóa</button>
                                              <button onClick={() => handleAcceptFriend(req)} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors">Xác nhận</button>
                                          </>
                                      }
                            />
                        ))}
                    </div>
                );

            case 'hiddenGroups':
                if (hiddenGroups.length === 0) return <EmptyState text="Không có nhóm nào bị ẩn." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {hiddenGroups.map(group => (
                            <UserCard key={group} username={group} subText="Đang bị ẩn"
                                      actions={
                                          <button onClick={() => handleUnhideGroup(group)} className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl text-sm font-semibold transition-colors">Hiện lại</button>
                                      }
                            />
                        ))}
                    </div>
                );

            case 'blocks':
                if (blocks.length === 0) return <EmptyState text="Bạn chưa chặn ai cả." />;
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {blocks.map(blockedUser => (
                            <UserCard key={blockedUser} username={blockedUser} subText="Đã chặn"
                                      actions={
                                          <button onClick={() => handleUnblock(blockedUser)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-semibold transition-colors">Bỏ chặn</button>
                                      }
                            />
                        ))}
                    </div>
                );

            case 'groupInvites':
                return <EmptyState text="Tính năng đang phát triển..." />;

            default:
                return null;
        }
    };

    const getTitle = () => {
        switch(activeTab) {
            case 'friends': return 'Danh sách bạn bè';
            case 'groups': return 'Nhóm & Cộng đồng';
            case 'friendRequests': return 'Lời mời kết bạn';
            case 'hiddenGroups': return 'Kho lưu trữ nhóm';
            case 'blocks': return 'Danh sách chặn';
            case 'groupInvites': return 'Lời mời vào nhóm';
            default: return 'Danh bạ';
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 relative">
            <div className="px-8 py-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{getTitle()}</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý các mối quan hệ của bạn</p>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {renderContent()}
            </div>

            {/* --- RENDER MODAL --- */}
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                onConfirm={modalConfig.onConfirm}
                onCancel={closeModal}
            />
        </div>
    );
};

const EmptyState = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
        </div>
        <p>{text}</p>
    </div>
);

export default ContactWindow;