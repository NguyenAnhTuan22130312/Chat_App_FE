import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import ChatList from './ChatList';
import { setActiveSidebarTab } from '../../store/slices/uiSlice'; // Import action

// Component con hiển thị dòng menu danh bạ
const ContactMenuItem = ({ icon, label, count, color, isBadgeRed }: any) => (
    <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all">
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

const Sidebar = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Lấy Tab hiện tại từ Redux
    const activeTab = useAppSelector((state) => state.ui.activeSidebarTab);

    const currentUser = useAppSelector((state) => state.auth.user?.username || 'Guest');
    const myAvatar = useUserAvatar(currentUser);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const handleLogout = () => {
        socketService.logout();
        localStorage.clear();
        window.location.reload();
    };

    const handleCreateRoom = () => {
        if (newRoomName.trim()) {
            socketService.createRoom(newRoomName.trim());
            setNewRoomName('');
            setShowCreateRoom(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-row">

            {/* 1. LEFT RAIL (75px) */}
            <div className="w-[75px] h-full flex flex-col items-center py-5 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 flex-shrink-0">

                {/* Avatar */}
                <div className="mb-6 cursor-pointer group" onClick={() => navigate('/profile')}>
                    <img src={myAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm group-hover:scale-105 transition-transform" />
                </div>

                {/* Tab Icons */}
                <div className="flex flex-col gap-5 w-full items-center flex-1">

                    {/* Icon Tin nhắn */}
                    <div
                        onClick={() => dispatch(setActiveSidebarTab('chats'))}
                        className={`p-3 rounded-xl cursor-pointer shadow-sm transition 
                            ${activeTab === 'chats'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title="Tin nhắn"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>

                    {/* Icon Danh bạ */}
                    <div
                        onClick={() => dispatch(setActiveSidebarTab('contacts'))}
                        className={`p-3 rounded-xl cursor-pointer shadow-sm transition 
                            ${activeTab === 'contacts'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                            : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        title="Danh bạ"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                </div>

                {/* Logout Popup */}
                <div className="mt-auto relative group flex justify-center w-full pb-4">
                    <button className="p-3 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-colors">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    <div className="absolute bottom-2 left-[60px] hidden group-hover:block z-50">
                        <div className="pl-4">
                            <div className="w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                                <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"><svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg><span className="text-sm font-semibold">Thông tin</span></div>
                                <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                                <div onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg><span className="text-sm font-medium">Đăng xuất</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0 border-r border-gray-200 dark:border-gray-800">

                {/* Header Search & Icons - ĐÃ KHÔI PHỤC 2 ICON TẠI ĐÂY */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
                    <div className="flex-1 relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={activeTab === 'contacts' ? "Tìm bạn bè..." : "Tìm hội thoại..."}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none"
                        />
                    </div>

                    {/* --- 2 ICON BẠN CẦN Ở ĐÂY --- */}
                    <div className="flex items-center gap-1">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg" title="Kết bạn">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </button>
                        <button onClick={() => setShowCreateRoom(true)} className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg" title="Tạo nhóm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto px-1 pt-2">
                    {activeTab === 'contacts' ? (
                        <div className="px-4 space-y-2 pt-2 animate-in fade-in duration-300">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Danh bạ</p>
                            <ContactMenuItem icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} label="Danh sách bạn bè" count={0} color="bg-blue-500" />
                            <ContactMenuItem icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} label="Nhóm & Cộng đồng" count={0} color="bg-green-500" />
                            <ContactMenuItem icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>} label="Lời mời kết bạn" count={3} isBadgeRed color="bg-indigo-500" />
                            <ContactMenuItem icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} label="Danh sách chặn" count={0} color="bg-red-500" />
                        </div>
                    ) : (
                        <ChatList searchQuery={searchQuery} />
                    )}
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoom && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px] shadow-2xl">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tạo phòng mới</h3>
                        <input autoFocus type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tên phòng..." />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateRoom(false)} className="px-4 py-2 text-sm font-medium text-gray-500">Hủy</button>
                            <button onClick={handleCreateRoom} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">Tạo ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;