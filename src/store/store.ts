import {configureStore} from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import chatPartnerReducer from './slices/chatPartnerSlice';
import chatReducer from './slices/chatSlice';
import currentChatReducer from './slices/currentChatSlice'
import lastMessageReducer from './slices/lastMessageSlice';
import unreadReducer from './slices/unreadSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        chatPartner: chatPartnerReducer,
        currentChat: currentChatReducer,
        lastMessage: lastMessageReducer,
        unread: unreadReducer,
        theme: themeReducer,
    },
});

// RootState: kiểu dữ liệu cho toàn bộ root tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch: Kiểu của dispatch function (dùng để gọi actions)
export type AppDispatch = typeof store.dispatch;