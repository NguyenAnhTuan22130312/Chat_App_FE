import {createSlice, PayloadAction, createAsyncThunk} from "@reduxjs/toolkit";
import { getAvatarFromFirebase } from "../../services/firebaseConfig";

interface User {
    username: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    reLoginCode: string | null;
    loading: boolean;
    error: string | null;
    registerSuccess: boolean;
    socketConnected: boolean;
    socketConnectionError: string | null;
}

export const fetchUserAvatar = createAsyncThunk(
    'auth/fetchAvatar',
    async (username: string) => {
        const url = await getAvatarFromFirebase(username);
        return url;
    }
);

const initialState: AuthState = {
    user: localStorage.getItem('username') ? {
        username: localStorage.getItem('username')!,
        avatar: localStorage.getItem('user_avatar') || undefined
    } : null,
    isAuthenticated: !!localStorage.getItem('reLoginCode'), 
    reLoginCode: localStorage.getItem('reLoginCode'),
    loading: false,
    error: null,
    registerSuccess: false,
    socketConnected: false,
    socketConnectionError: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginRequest: (state) => {
            state.loading = true;
            state.error = null;
        },

        loginSuccess: (state, action: PayloadAction<{ user: User; reLoginCode?: string }>) => {
            state.loading = false;
            state.isAuthenticated = true;
            
            const currentAvatar = state.user?.avatar || localStorage.getItem('user_avatar');
            state.user = {
                ...action.payload.user,
                avatar: currentAvatar || undefined
            };

            if (action.payload.reLoginCode) {
                state.reLoginCode = action.payload.reLoginCode;
                localStorage.setItem('reLoginCode', action.payload.reLoginCode);
                localStorage.setItem('username', action.payload.user.username);
            }
            state.error = null;
        },

        updateAvatar: (state, action: PayloadAction<string>) => {
            if (state.user) {
              state.user.avatar = action.payload;
              localStorage.setItem('user_avatar', action.payload);
            }
        },

        loginFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isAuthenticated = false;
            state.user = null;
            state.error = action.payload;
        },

        registerSuccess: (state) => {
            state.loading = false;
            state.error = null;
            state.registerSuccess = true;
        },

        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.reLoginCode = null;
            state.error = null;
            localStorage.removeItem('reLoginCode');
            localStorage.removeItem('username');
            localStorage.removeItem('user_avatar');
        },

        clearError: (state) => {
            state.error = null;
        },

        socketConnected: (state) => {
            state.socketConnected = true;
            state.socketConnectionError = null;
        },

        socketDisconnected: (state) => {
            state.socketConnected = false;
        },

        socketConnectionError: (state, action: PayloadAction<string>) => {
            state.socketConnected = false;
            state.socketConnectionError = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUserAvatar.fulfilled, (state, action) => {
            if (state.user && action.payload) {
                state.user.avatar = action.payload;
                localStorage.setItem('user_avatar', action.payload);
            }
        });
    }
});

export const {
    loginRequest,
    loginSuccess,
    loginFailure,
    registerSuccess,
    logout,
    clearError,
    socketConnected,
    socketDisconnected,
    socketConnectionError,
    updateAvatar,
} = authSlice.actions;

export default authSlice.reducer;