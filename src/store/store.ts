import {configureStore} from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import currentChatReducer from './slices/currentChatSlice';
import userListReducer from './slices/userListSlice';
export const store = configureStore({
    reducer: {
        auth: authReducer,
        currentChat: currentChatReducer,
        userList: userListReducer,
    },
});

// RootState: kiểu dữ liệu cho toàn bộ root tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch: Kiểu của dispatch function (dùng để gọi actions)
export type AppDispatch = typeof store.dispatch;