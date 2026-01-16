import React, {useEffect} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom'; 

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
import ContactWindow from './components/contact/ContactWindow';
import HomeLayout from "./components/Layout/HomeLayout";
import {useFirebaseLists} from "./hooks/useFirebaseLists";

function App() {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const socketConnected = useAppSelector((state) => state.auth.socketConnected);
    const socketConnectionError = useAppSelector((state) => state.auth.socketConnectionError);
    const themeMode = useAppSelector((state) => state.theme.mode);
    const dispatch = useAppDispatch();

    const user = useAppSelector((state) => state.auth.user); 
    const { friends, groups } = useFirebaseLists(user?.username);
    
    useEffect(() => {
        if (isAuthenticated && user?.username) {
            socketService.setWhitelist(friends, groups);
        }
    }, [friends, groups, isAuthenticated, user]);


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

            if (isAuthenticated) {
                const reLoginCode = localStorage.getItem('reLoginCode');
                const username = localStorage.getItem('username');
                const savedUsername = localStorage.getItem('username');
                if (savedUsername) {
                    dispatch(fetchUserAvatar(savedUsername));
                }
                if (reLoginCode && username) {
                    store.dispatch(loginRequest());
                    socketService.reLogin(username, reLoginCode);
                }
            }
        };

        initializeConnection();
    }, [isAuthenticated]);

    if (!socketConnected && !socketConnectionError) {
        return <LoadingScreen />;
    }

    if (socketConnectionError) {
        return <ConnectionErrorScreen errorMessage={socketConnectionError} />;
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                }
            />

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

            <Route
                path="/"
                element={
                    isAuthenticated ? <HomeLayout /> : <Navigate to="/login" replace/>
                }
            >
            </Route>
        </Routes>
    );
}

export default App;