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
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-[25%] h-full bg-gray-100 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 hidden md:flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
                    <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Chat App</h2>
                    {username && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Xin chào, {username}</p>
                    )}
                    </div>
                <img
                        src={user?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7imMwm5oKZ8t3qnhAptR3ZzpD-i2AuSiHoQ&s"}
                        alt="My Avatar"
                        className="w-12 h-12 rounded-full object-cover border border-gray-300 ml-3"
                    />
                </div>

                {/* Sidebar Content - Danh sách chat mới (Trung Han build) */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {/* Search bar */}
                    <div className="p-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm người hoặc phòng..."
                            className="w-full px-4 py-2.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            // Bạn có thể thêm state search ở đây sau nếu muốn, tạm thời để static đẹp trước
                        />
                    </div>

                    {/* Danh sách cuộc trò chuyện */}
                    <div className="flex-1 overflow-y-auto px-2">
                        <ChatList searchQuery={""} />
                    </div>
                </div>

                {/* Logout Button at bottom */}
                <div className="p-4 border-t border-gray-300">
                <div
                        onClick={() => navigate('/profile')}
                        className="mb-4 flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-600"
                    >
                        {/* User Avatar */}
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3 overflow-hidden w-10 h-10 flex items-center justify-center">
                            {user?.avatar ? (
                                <img 
                                    src={user.avatar} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover rounded-full"
                                />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">Thông tin cá nhân</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Đổi avatar, xem thông tin</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 h-full">
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