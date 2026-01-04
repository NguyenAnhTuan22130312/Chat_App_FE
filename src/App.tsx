import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate, useNavigate} from 'react-router-dom';
import Login from './screens/Login';
import Register from './screens/Register';
import ChatWindow from './components/chat/ChatWindow';
import LoadingScreen from './components/common/LoadingScreen';
import ConnectionErrorScreen from './components/common/ConnectionErrorScreen';
import {useAppSelector, useAppDispatch} from "./hooks/reduxHooks";
import {socketService} from "./services/socketService";
import {loginRequest, logout} from "./store/slices/authSlice";
import {store} from "./store/store";

// Component for Home layout with Sidebar
function HomeLayout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const username = useAppSelector((state) => state.auth.user?.username);

    const handleLogout = () => {
        try {
            // Gọi API LOGOUT qua socket (sẽ skip nếu socket chưa ready)
            socketService.logout();
        } catch (error) {
            console.error('Error during logout:', error);
        }
        
        // Dispatch logout action để clear state
        dispatch(logout());
        
        // Navigate về trang login
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-[360px] h-full bg-gray-100 border-r border-gray-300 hidden md:flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-300">
                    <h2 className="text-lg font-bold text-gray-800">Chat App</h2>
                    {username && (
                        <p className="text-sm text-gray-600 mt-1">Xin chào, {username}</p>
                    )}
                </div>

                {/* Sidebar Content - Chat list area */}
                <div className="flex-1 overflow-y-auto p-4">
                    <span className="text-gray-400 text-sm">
                        Sidebar Area <br/> (Danh sách chat - Trung Han)
                    </span>
                </div>

                {/* Logout Button at bottom */}
                <div className="p-4 border-t border-gray-300">
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

    useEffect(() => {
        // Hàm async để đợi WebSocket kết nối
        const initializeConnection = async () => {
            // Kết nối WebSocket khi project khởi động
            console.log('Initializing WebSocket connection...');
            try {
                await socketService.connect();
                
                // Chỉ auto-login nếu đã authenticated
                if (isAuthenticated) {
                    // Kiểm tra có RE_LOGIN_CODE trong localStorage không
                    const reLoginCode = localStorage.getItem('reLoginCode');
                    const username = localStorage.getItem('username');

                    if (reLoginCode && username) {
                        // Có -> Tự động đăng nhập lại
                        console.log('Success, attempting auto-login...');
                        store.dispatch(loginRequest());
                        socketService.reLogin(username, reLoginCode);
                    } else {
                        console.log('Error, user needs to login manually');
                    }
                }
            } catch (error) {
                console.error('Failed to initialize WebSocket connection:', error);
            }
        };

        initializeConnection();

        // Cleanup khi unmount - KHÔNG disconnect socket nữa
        // Vì socket cần duy trì để login hoạt động
        return () => {
            // socketService.disconnect(); // Đã remove
        };
    }, []); // Chỉ chạy 1 lần khi app mount

    // Show loading screen while connecting
    if (!socketConnected && !socketConnectionError) {
        return <LoadingScreen />;
    }

    // Show error screen if connection failed
    if (socketConnectionError) {
        return <ConnectionErrorScreen errorMessage={socketConnectionError} />;
    }

    // Show main app when connected
    return (
        <Router>
            <Routes>
                {/* Route Login */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? <Navigate to="/" replace/> : <Login/>
                    }
                />

                {/* Route Register */}
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? <Navigate to="/" replace/> : <Register/>
                    }
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