import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/reduxHooks';
import { useUserAvatar } from '../../hooks/useUserAvatar';
import { setActiveSidebarTab } from '../../store/slices/uiSlice';
import { socketService } from '../../services/socketService';

const SidebarRail = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const activeTab = useAppSelector((state) => state.ui.activeSidebarTab);
    const currentUser = useAppSelector((state) => state.auth.user?.username || 'Guest');
    const myAvatar = useUserAvatar(currentUser);

    const handleLogout = () => {
        socketService.logout();
        localStorage.clear();
        window.location.reload();
    };

    return (
        <div className="w-[75px] h-full flex flex-col items-center py-5 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20 flex-shrink-0">

            <div className="mb-6 cursor-pointer group" onClick={() => navigate('/profile')}>
                <img src={myAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm group-hover:scale-105 transition-transform" />
            </div>

            <div className="flex flex-col gap-5 w-full items-center flex-1">
                <div onClick={() => dispatch(setActiveSidebarTab('chats'))} className={`p-3 rounded-xl cursor-pointer shadow-sm transition ${activeTab === 'chats' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <div onClick={() => dispatch(setActiveSidebarTab('contacts'))} className={`p-3 rounded-xl cursor-pointer shadow-sm transition ${activeTab === 'contacts' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
            </div>

            <div className="mt-auto relative group flex justify-center w-full pb-4">
                <button className="p-3 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <div className="absolute bottom-2 left-[60px] hidden group-hover:block z-50 pl-4">
                    <div className="w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                        <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"><span className="text-sm font-semibold">Thông tin</span></div>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
                        <div onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"><span className="text-sm font-medium">Đăng xuất</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SidebarRail;