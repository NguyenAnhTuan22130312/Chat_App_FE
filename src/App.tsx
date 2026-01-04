import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './screens/Login';
import Register from './screens/Register';
import ChatWindow from './components/chat/ChatWindow';
import { useAppSelector } from "./hooks/reduxHooks";
import { socketService } from "./services/socketService";
import { loginRequest } from "./store/slices/authSlice";
import { store } from "./store/store";

function App() {
    // Lấy trạng thái đăng nhập từ Redux
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        const initializeConnection = async () => {
            // 1. Kết nối WebSocket
            console.log('Initializing WebSocket connection...');
            await socketService.connect();

            // 2. Kiểm tra xem có phiên đăng nhập cũ không
            const reLoginCode = localStorage.getItem('reLoginCode');
            const username = localStorage.getItem('username');

            if (reLoginCode && username) {
                console.log('Found session, attempting auto-login...');
                // Nếu có, dispatch action để loading và gửi lệnh RE_LOGIN
                store.dispatch(loginRequest());
                socketService.reLogin(username, reLoginCode);
            } else {
                console.log('No session found, user needs to login manually');
            }
        };

        initializeConnection();

        // Cleanup: Ngắt kết nối khi tắt App (optional)
        return () => {
            socketService.disconnect();
        };
    }, []);

    return (
        <Router>
            <Routes>
                {/* 1. Route Đăng Nhập */}
                <Route
                    path="/login"
                    element={
                        // Nếu đã đăng nhập thì đá sang trang chủ, chưa thì hiện Login
                        isAuthenticated ? <Navigate to="/" replace /> : <Login />
                    }
                />

                {/* 2. Route Đăng Ký */}
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? <Navigate to="/" replace /> : <Register />
                    }
                />

                {/* 3. Route Chính (Chat) - Được bảo vệ */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            // --- GIAO DIỆN CHÍNH ---
                            <div className="flex h-screen w-full overflow-hidden bg-white">
                                {/* Sidebar giả (Chờ Trung Han) */}
                                <div className="w-[360px] h-full bg-gray-100 border-r border-gray-300 hidden md:flex items-center justify-center">
                                    <span className="text-gray-400 font-bold text-center">
                                        Sidebar Area <br /> (Trung Han)
                                    </span>
                                </div>
                                
                                {/* Chat Window (Của Tuấn 12) */}
                                <div className="flex-1 h-full">
                                    <ChatWindow />
                                </div>
                            </div>
                        ) : (
                            // Nếu chưa đăng nhập -> Đá về Login
                            <Navigate to="/login" replace />
                        )
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;