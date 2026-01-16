import {configureStore} from "@reduxjs/toolkit";
import authReducer from './slices/authSlice';
import chatPartnerReducer from './slices/chatPartnerSlice';
import chatReducer from './slices/chatSlice';
import currentChatReducer from './slices/currentChatSlice'
import unreadReducer from './slices/unreadSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';
import searchReducer from './slices/searchSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: chatReducer,
        chatPartner: chatPartnerReducer,
        currentChat: currentChatReducer,
        // lastMessage: lastMessageReducer,
        unread: unreadReducer,
        theme: themeReducer,
        ui: uiReducer,
        search: searchReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;