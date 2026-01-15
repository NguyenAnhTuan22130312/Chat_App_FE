import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import ChatList from './ChatList';
import { useFirebaseLists } from '../../hooks/useFirebaseLists';
import { clearSearch } from '../../store/slices/searchSlice';
import { sendFriendRequest } from '../../services/friendService';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import {
    setActiveContactTab,
    setJoinRoomStatus,
    resetJoinRoomState
} from '../../store/slices/uiSlice';
const ContactMenuItem = ({ icon, label, count, color, isBadgeRed, onClick }: any) => (
    <div
        onClick={onClick}
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

// --- MAIN COMPONENT ---

const SidebarPanel = ({ onOpenCreateRoom }: { onOpenCreateRoom: () => void }) => {
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector((state) => state.ui.activeSidebarTab);
    const { isSearching, searchResult, searchedUsername } = useAppSelector((state) => state.search);
    const currentUser = useAppSelector((state) => state.auth.user?.username || 'Guest');

    // Redux State cho Join Room
    const { joinRoomStatus, joinRoomError } = useAppSelector((state) => state.ui);

    const { friends, blocks, groups, friendRequests, groupInvites, hiddenGroups } = useFirebaseLists(currentUser);

    // Local States
    const [searchQuery, setSearchQuery] = useState('');

    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [targetFriendName, setTargetFriendName] = useState('');
    const [helloMessage, setHelloMessage] = useState('Chào bạn, mình muốn kết bạn với cậu!');

    // State Modal Join Room
    const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
    const [joinRoomName, setJoinRoomName] = useState('');

    // --- EFFECTS ---
    useEffect(() => {
        setSearchQuery('');
        dispatch(clearSearch());
    }, [activeTab, dispatch]);

    // Effect lắng nghe kết quả Join Room để đóng modal
    useEffect(() => {
        if (joinRoomStatus === 'success') {
            setShowJoinRoomModal(false);
            setJoinRoomName('');
            dispatch(resetJoinRoomState());
        }
    }, [joinRoomStatus, dispatch]);

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (!e.target.value) dispatch(clearSearch());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            socketService.checkUserExist(searchQuery.trim());
        }
    };

    // --- Add Friend Logic ---
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

    // --- Join Room Logic ---
    const handleOpenJoinModal = () => {
        dispatch(resetJoinRoomState()); // Xóa lỗi cũ trước khi mở
        setJoinRoomName('');
        setShowJoinRoomModal(true);
    };

    const handleJoinRoom = () => {
        if (joinRoomName.trim()) {
            dispatch(setJoinRoomStatus('loading'));
            socketService.joinRoom(joinRoomName.trim());
        }
    };

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
                {searchQuery ? (
                    // ĐANG SEARCH
                    isSearching ? (
                        <div className="p-4 text-center text-gray-500 text-sm animate-pulse">Đang tìm kiếm...</div>
                    ) : searchedUsername ? (
                        <SearchResultCard
                            targetUsername={searchedUsername}
                            exists={searchResult}
                            isFriend={friends.includes(searchedUsername)}
                            isBlocked={blocks.includes(searchedUsername)}
                            isMe={searchedUsername === currentUser}
                            onOpenAddModal={handleOpenAddModal}
                        />
                    ) : (
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
                                onClick={() => dispatch(setActiveContactTab('friends'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                label="Danh sách bạn bè"
                                count={friends.length}
                                color="bg-blue-500"
                            />

                            {/* 2. Nhóm */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('groups'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                label="Nhóm & Cộng đồng"
                                count={groups.length}
                                color="bg-green-500"
                            />

                            {/* 3. MỤC MỚI: THAM GIA NHÓM */}
                            <ContactMenuItem
                                onClick={handleOpenJoinModal}
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                }
                                label="Tham gia nhóm bằng tên"
                                count={0}
                                color="bg-orange-500"
                            />

                            {/* 4. Lời mời kết bạn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('friendRequests'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                                label="Lời mời kết bạn"
                                count={friendRequests.length}
                                isBadgeRed
                                color="bg-indigo-500"
                            />

                            {/* 5. Lời mời vào nhóm */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('groupInvites'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
                                label="Lời mời vào nhóm"
                                count={groupInvites.length}
                                color="bg-purple-500"
                            />

                            {/* 6. Nhóm đã ẩn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('hiddenGroups'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                                label="Nhóm đã ẩn"
                                count={hiddenGroups.length}
                                color="bg-gray-500"
                            />

                            {/* 7. Danh sách chặn */}
                            <ContactMenuItem
                                onClick={() => dispatch(setActiveContactTab('blocks'))}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                                label="Danh sách chặn"
                                count={blocks.length}
                                color="bg-red-500"
                            />
                        </div>
                    ) : <ChatList searchQuery={searchQuery} />
                )}
            </div>

            {/* Modal Kết bạn */}
            {showAddFriendModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px] shadow-2xl">
                        <h3 className="font-bold dark:text-white">Kết bạn với {targetFriendName}</h3>
                        <textarea autoFocus rows={3} value={helloMessage} onChange={(e) => setHelloMessage(e.target.value)} className="w-full mt-2 p-2 border rounded bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowAddFriendModal(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Hủy</button>
                            <button onClick={handleSendRequest} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30">Gửi</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL JOIN ROOM (ĐÃ SỬA LỖI THẺ P) */}
            {showJoinRoomModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px] shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tham gia nhóm</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Nhập chính xác tên nhóm mà bạn muốn tham gia.</p>

                        <input
                            autoFocus
                            type="text"
                            value={joinRoomName}
                            onChange={(e) => setJoinRoomName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                            disabled={joinRoomStatus === 'loading'}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none text-sm transition-all disabled:opacity-50"
                            placeholder="Tên nhóm..."
                        />

                        {/* HIỂN THỊ LỖI (Đã sửa lỗi đóng thẻ) */}
                        {joinRoomStatus === 'failed' && joinRoomError && (
                            <p className="text-xs text-red-500 mt-2 font-semibold flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {joinRoomError}
                            </p>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowJoinRoomModal(false)}
                                disabled={joinRoomStatus === 'loading'}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleJoinRoom}
                                disabled={joinRoomStatus === 'loading'}
                                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {joinRoomStatus === 'loading' ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <span>Tham gia</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* HIỂN THỊ LỖI NẾU CÓ */}
            {joinRoomStatus === 'failed' && joinRoomError && (
                <p className="text-xs text-red-500 mt-2 font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {/* Nó sẽ hiện dòng: "Room not found" */}
                    {joinRoomError}
                </p>
            )}
        </div>
    );
};

export default SidebarPanel;