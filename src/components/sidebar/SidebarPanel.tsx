import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import ChatList from './ChatList';
import { useFirebaseLists } from '../../hooks/useFirebaseLists';
import { clearSearch } from '../../store/slices/searchSlice';
import { sendFriendRequest } from '../../services/friendService';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import {setActiveContactTab} from "../../store/slices/uiSlice";

// Components con (Menu Item) - Giữ nguyên
const ContactMenuItem = ({ icon, label, count, color, isBadgeRed }: any) => (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all">
        <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center shadow-sm`}>{icon}</div>
        <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBadgeRed ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>{count > 99 ? '99+' : count}</span>}
        </div>
    </div>
);

// --- SEARCH RESULT CARD (Đã tinh gọn lại logic hiển thị) ---
const SearchResultCard = ({ targetUsername, exists, isFriend, isBlocked, isMe, onOpenAddModal }: any) => {
    const avatar = useUserAvatar(targetUsername);

    if (exists === false) return <div className="p-4 text-center text-gray-500 text-sm">Người dùng không tồn tại</div>;

    if (exists === true) return (
        <div className="mx-4 mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
            <img src={avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 dark:text-white truncate">{targetUsername}</h4>
                {isMe ? <p className="text-xs text-blue-500">Là bạn đấy!</p> : isBlocked ? <p className="text-xs text-red-500 font-medium">Đã chặn người này</p> : isFriend && <p className="text-xs text-green-500">Đã là bạn bè</p>}
            </div>
            {!isMe && !isBlocked && !isFriend && (
                <button onClick={() => onOpenAddModal(targetUsername)} className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-colors" title="Gửi lời mời kết bạn">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </button>
            )}
        </div>
    );

    return null;
};

const SidebarPanel = ({ onOpenCreateRoom }: { onOpenCreateRoom: () => void }) => {
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector((state) => state.ui.activeSidebarTab);

    const { isSearching, searchResult, searchedUsername } = useAppSelector((state) => state.search);

    const currentUser = useAppSelector((state) => state.auth.user?.username || 'Guest');
    const { friends, blocks,groups, friendRequests, groupInvites , hiddenGroups} = useFirebaseLists(currentUser);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [targetFriendName, setTargetFriendName] = useState('');
    const [helloMessage, setHelloMessage] = useState('Chào bạn, mình muốn kết bạn với cậu!');


    useEffect(() => {
        setSearchQuery('');
        dispatch(clearSearch());
    }, [activeTab, dispatch]);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (!e.target.value) dispatch(clearSearch());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            // Khi Enter, searchedUsername trong Redux sẽ được cập nhật
            socketService.checkUserExist(searchQuery.trim());
        }
    };

    const handleOpenAddModal = (name: string) => {
        setTargetFriendName(name);
        setHelloMessage(`Chào ${name}, mình muốn kết bạn với cậu!`);
        setShowAddFriendModal(true);
    };

    const handleSendRequest = async () => {
        try {
            await sendFriendRequest(currentUser, targetFriendName);
            socketService.sendMessageToPeople(targetFriendName, helloMessage);
            alert(`Đã gửi lời mời tới ${targetFriendName}`);
            setShowAddFriendModal(false);
            setSearchQuery('');
            dispatch(clearSearch());
        } catch (error) { alert("Lỗi: " + error); }
    };
    // Thêm onClick vào destructuring props và div
    const ContactMenuItem = ({ icon, label, count, color, isBadgeRed, onClick }: any) => (
        <div
            onClick={onClick} // <--- QUAN TRỌNG: Phải gắn sự kiện vào đây
            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all"
        >
            <div className={`w-10 h-10 rounded-full ${color} text-white flex items-center justify-center shadow-sm`}>
                {icon}
            </div>
            <div className="flex-1 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                {count > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBadgeRed ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {count > 99 ? '99+' : count}
                </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0 border-r border-gray-200 dark:border-gray-800 relative">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
                <div className="flex-1 relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                    <input type="text" value={searchQuery} onChange={handleSearchInput} onKeyDown={handleKeyDown} placeholder={activeTab === 'contacts' ? "Tìm nhóm..." : "Tìm bạn bè..."} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm outline-none" />
                </div>
                <button onClick={onOpenCreateRoom} className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto px-1 pt-2">
                {/* LOGIC HIỂN THỊ MỚI */}
                {searchQuery ? (
                    // ĐANG Ở CHẾ ĐỘ SEARCH
                    isSearching ? (
                        <div className="p-4 text-center text-gray-500 text-sm animate-pulse">Đang tìm kiếm...</div>
                    ) : searchedUsername ? (
                        // Đã có kết quả (Đã Enter) -> Truyền searchedUsername (cố định) chứ không phải searchQuery (đang gõ)
                        <SearchResultCard
                            targetUsername={searchedUsername}
                            exists={searchResult}
                            isFriend={friends.includes(searchedUsername)}
                            isBlocked={blocks.includes(searchedUsername)}
                            isMe={searchedUsername === currentUser}
                            onOpenAddModal={handleOpenAddModal}
                        />
                    ) : (
                        // Chưa Enter
                        <div className="p-4 text-center text-gray-400 text-sm mt-4">
                            Nhấn <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs mx-1">Enter</kbd> để tìm kiếm
                        </div>
                    )
                ) : (
                    // KHÔNG SEARCH -> HIỆN MENU CHÍNH
                    activeTab === 'contacts' ? (
                        <div className="px-4 space-y-2 pt-2 animate-in fade-in duration-300">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-2">Danh bạ</p>

                            {/* 1. Bạn bè */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('friends'))} // <--- THÊM
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                label="Danh sách bạn bè"
                                count={friends.length}
                                color="bg-blue-500"
                            />

                            {/* 2. Nhóm (Mình sửa count={0} thành groups.length cho đúng logic luôn nhé) */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('groups'))} // <--- THÊM
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                label="Nhóm & Cộng đồng"
                                count={groups.length} // <--- SỬA
                                color="bg-green-500"
                            />

                            {/* 3. Lời mời kết bạn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('friendRequests'))} // <--- THÊM
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                                label="Lời mời kết bạn"
                                count={friendRequests.length}
                                isBadgeRed
                                color="bg-indigo-500"
                            />

                            {/* 4. Lời mời vào nhóm */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('groupInvites'))} // <--- THÊM
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                                label="Lời mời vào nhóm"
                                count={groupInvites.length}
                                color="bg-purple-500"
                            />

                            {/* 5. Nhóm đã ẩn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('hiddenGroups'))} // <--- THÊM
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                }
                                label="Nhóm đã ẩn"
                                count={hiddenGroups.length}
                                color="bg-gray-500"
                            />

                            {/* 6. Danh sách chặn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('blocks'))} // <--- THÊM
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                                label="Danh sách chặn"
                                count={blocks.length}
                                color="bg-red-500"
                            />
                        </div>
                    ) : <ChatList searchQuery={searchQuery} />
                )}
            </div>

            {/* Modal */}
            {showAddFriendModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px]">
                        <h3 className="font-bold dark:text-white">Kết bạn với {targetFriendName}</h3>
                        <textarea autoFocus rows={3} value={helloMessage} onChange={(e) => setHelloMessage(e.target.value)} className="w-full mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-700" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowAddFriendModal(false)} className="px-4 py-2 text-gray-500">Hủy</button>
                            <button onClick={handleSendRequest} className="px-4 py-2 bg-blue-600 text-white rounded">Gửi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarPanel;