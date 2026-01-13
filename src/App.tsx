import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate} from 'react-router-dom';
import Login from './screens/Login';
import Register from './screens/Register';
import ChatWindow from './components/chat/ChatWindow';
import LoadingScreen from './components/common/LoadingScreen';
import ConnectionErrorScreen from './components/common/ConnectionErrorScreen';
import {useAppSelector, useAppDispatch} from "./hooks/reduxHooks";
import {socketService} from "./services/socketService";
import {loginRequest, logout,fetchUserAvatar} from "./store/slices/authSlice";
import {store} from "./store/store";
import Profile from './screens/Profile';
import ChatList from "./components/sidebar/ChatList";


// Component for Home layout with Sidebar
function HomeLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const username = useAppSelector((state) => state.auth.user?.username);

    const handleLogout = () => {
        // Gọi API LOGOUT qua socket
        socketService.logout();

        // Dispatch logout action để xoá state
        dispatch(logout());

        // Tải lại trang để kết nối lại WebSocket
        window.location.reload();
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-900">

            {/* --- KHUNG SIDEBAR TỔNG (25%) --- */}
            {/* SỬA: w-[30%] -> w-[25%] */}
            <div className="w-[25%] h-full hidden md:flex flex-row border-r border-gray-300 dark:border-gray-700">

                {/* 1. LEFT SIDEBAR (RAIL) - 75px cố định */}
                <div className="w-[75px] h-full flex flex-col items-center py-5 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20">

                    {/* Top: Avatar */}
                    <div className="mb-6 cursor-pointer group" onClick={() => navigate('/profile')}>
                        <img
                            src={user?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7imMwm5oKZ8t3qnhAptR3ZzpD-i2AuSiHoQ&s"}
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm group-hover:scale-105 transition-transform"
                        />
                    </div>

                    {/* Middle: Tab Icons */}
                    <div className="flex flex-col gap-5 w-full items-center flex-1">
                        {/* Icon Tin nhắn */}
                        <div className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl cursor-pointer shadow-sm hover:brightness-110 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>

                        {/* Icon Danh bạ */}
                        <div className="p-3 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    </div>

                    {/* Bottom: Settings */}
                    <div className="mt-auto relative group flex justify-center w-full pb-4">
                        {/* Icon Setting */}
                        <button className="p-3 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>

                        {/* Menu Popup */}
                        {/* SỬA: left-[60px] để gần hơn và thêm lớp pl-4 vô hình để làm cầu nối chuột */}
                        <div className="absolute bottom-2 left-[60px] hidden group-hover:block z-50">
                            {/* Wrapper tạo vùng an toàn để di chuột */}
                            <div className="pl-4">
                                <div className="w-52 bg-white dark:bg-gray-800 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-700 p-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                    {/* Info */}
                                    <div onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <div className="text-sm">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Thông tin cá nhân</p>
                                            <p className="text-xs text-gray-500">Sửa avatar, tên</p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>

                                    {/* Logout */}
                                    <div onClick={handleLogout} className="flex items-center gap-3 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg cursor-pointer text-red-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        <span className="text-sm font-medium">Đăng xuất</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. RIGHT SIDEBAR (PANEL) - Chứa Search và ChatList */}
                <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
                    {/* Header: Search + Icons */}
                    <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 flex-shrink-0 gap-2">
                        {/* Search Bar */}
                        <div className="flex-1 relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 group-focus-within:text-blue-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 outline-none text-gray-800 dark:text-white"
                            />
                        </div>

                        {/* Icons: Add Friend & Create Group */}
                        <div className="flex items-center gap-1">
                            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg" title="Kết bạn">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                            </button>
                            <button className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg" title="Tạo nhóm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Chat List Content */}
                    <div className="flex-1 overflow-y-auto px-1 pt-2">
                        <ChatList searchQuery={""} />
                    </div>
                </div>
            </div>

            {/* --- MAIN CHAT AREA (75%) --- */}
            {/* SỬA: w-[70%] -> w-[75%] */}
            <div className="flex-1 h-full w-[75%] min-w-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                <ChatWindow/>
            </div>
        </div>
    );
}

function App() {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const socketConnected = useAppSelector((state) => state.auth.socketConnected);
    const socketConnectionError = useAppSelector((state) => state.auth.socketConnectionError);
    const themeMode = useAppSelector((state) => state.theme.mode);
    const dispatch = useAppDispatch();

    // Thêm chế độ dark mode
    useEffect(() => {
        const root = document.documentElement;
        if (themeMode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [themeMode]);

    useEffect(() => {
        const initializeConnection = async () => {
            await socketService.connect();

            // Chỉ tự động đăng nhập nếu đã xác thực
            if (isAuthenticated) {
                const reLoginCode = localStorage.getItem('reLoginCode');
                const username = localStorage.getItem('username');
                const savedUsername = localStorage.getItem('username');
                if (savedUsername) {
                    dispatch(fetchUserAvatar(savedUsername));
                }
                if (reLoginCode && username) {
                    // Tự động đăng nhập lại
                    store.dispatch(loginRequest());
                    socketService.reLogin(username, reLoginCode);
                }
            }
        };

        initializeConnection();
    }, [isAuthenticated]);

    // Hiển thị màn hình loading khi chờ kết nối
    if (!socketConnected && !socketConnectionError) {
        return <LoadingScreen />;
    }

    // Hiển thị lỗi nếu lỗi kết nối
    if (socketConnectionError) {
        return <ConnectionErrorScreen errorMessage={socketConnectionError} />;
    }

    return (
        <Router>
            <Routes>
                {/* Route Login */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Login />
                    }
                />

                {/* Route Register */}
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Register />
                    }
                />

                <Route
                    path="/profile"
                    element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
                />

                {/* Protected Route - Trang Home/Chat */}
                <Route
                    path="/"
                    element={

                        isAuthenticated ? <HomeLayout /> : <Navigate to="/login" replace/>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;