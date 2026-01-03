import React, {useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './screens/Login';
import Register from './screens/Register';
import ChatWindow from './components/chat/ChatWindow';
import {useAppSelector} from "./hooks/reduxHooks";
import {socketService} from "./services/socketService";
import {loginRequest} from "./store/slices/authSlice";
import {store} from "./store/store";

function App() {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

    useEffect(() => {
        // Hàm async để đợi WebSocket kết nối
        const initializeConnection = async () => {
            // Kết nối WebSocket khi project khởi động
            console.log('Initializing WebSocket connection...');
            await socketService.connect();

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
        };

        initializeConnection();

        // Cleanup khi unmount
        return () => {
            socketService.disconnect();
        };
    }, []);

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
                        isAuthenticated ? (
                            <div className="flex h-screen w-full overflow-hidden bg-white">
                                <div
                                    className="w-[360px] h-full bg-gray-100 border-r border-gray-300 hidden md:flex items-center justify-center">
              <span className="text-gray-400 font-bold">
                Sidebar Area <br/> (Trung Han)
              </span>
                                </div>
                                <div className="flex-1 h-full">
                                    <ChatWindow/>
                                </div>
                            </div>
                        ) : (
                            <Navigate to="/login" replace/>
                        )
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;