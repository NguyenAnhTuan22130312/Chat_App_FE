import { useAppSelector } from '../../hooks/reduxHooks';
import { socketService } from '../../services/socketService';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { useState } from 'react';
import ChatList from './ChatList';

const Sidebar = () => {
    const currentUser = useAppSelector((state) => state.auth.user?.username || 'Guest');
    const myAvatar = useUserAvatar(currentUser);

    const [searchQuery, setSearchQuery] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [showCreateRoom, setShowCreateRoom] = useState(false);

    const handleCreateRoom = () => {
        if (newRoomName.trim()) {
            socketService.createRoom(newRoomName.trim());
            setNewRoomName('');
            setShowCreateRoom(false);
        }
    };

    const handleLogout = () => {
        socketService.logout();
        localStorage.clear();
        window.location.reload();
    };

    return (
        <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col border-r border-gray-200 dark:border-gray-800">
            {/* Header: Thông tin cá nhân & Actions */}
            <div className="p-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img
                            src={myAvatar}
                            alt="Avatar"
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/20"
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div className="hidden lg:block">
                        <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{currentUser}</p>
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Trực tuyến</p>
                    </div>
                </div>

                <div className="flex gap-1">
                    <button
                        onClick={() => setShowCreateRoom(true)}
                        className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-gray-700 rounded-full transition-all"
                        title="Tạo nhóm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-gray-700 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>

            {/* Thanh Search Duy Nhất */}
            <div className="px-4 py-2">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm hội thoại..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Danh sách chat - Truyền filter query xuống */}
            <div className="flex-1 overflow-hidden flex flex-col mt-2">
                <ChatList searchQuery={searchQuery} />
            </div>

            {/* Modal tạo phòng */}
            {showCreateRoom && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-[320px] shadow-2xl scale-95 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tạo phòng mới</h3>
                        <p className="text-xs text-gray-500 mb-4">Mọi người có thể tham gia qua tên phòng này.</p>
                        <input
                            autoFocus
                            type="text"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Tên phòng là gì?"
                        />
                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowCreateRoom(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Hủy</button>
                            <button onClick={handleCreateRoom} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 transition-all">Tạo ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;