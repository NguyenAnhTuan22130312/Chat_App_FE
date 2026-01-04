import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface User {
    username: string;
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

// State ban đầu khi project khởi động
const initialState: AuthState = {
    user: null,  // ← Không load username từ localStorage ở đây nữa
    isAuthenticated: false,  // ← Luôn false khi khởi động
    reLoginCode: null,       // ← Không load từ localStorage
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
        // Bắt đầu yêu cầu đăng nhập/đăng ký
        loginRequest: (state) => {
            state.loading = true;
            state.error = null;
        },

        // Đăng nhập thành công, nhận thông tin user và re_login_code từ server
        loginSuccess: (state, action: PayloadAction<{ user: User; reLoginCode?: string }>) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;

            // If server trả về re_login_code thì lưu vào state và localStorage
            if (action.payload.reLoginCode) {
                state.reLoginCode = action.payload.reLoginCode;
                localStorage.setItem('reLoginCode', action.payload.reLoginCode);
                // Lưu username để dùng cho RE_LOGIN
                localStorage.setItem('username', action.payload.user.username);
            }
            state.error = null;
        },

        // Đăng nhập failure
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

        // Đăng xuất
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.reLoginCode = null;
            state.error = null;
            localStorage.removeItem('reLoginCode');
            localStorage.removeItem('username');
        },

        clearError: (state) => {
            state.error = null;
        },

        // WebSocket connection actions
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
} = authSlice.actions;

// Export reducer để add vào store
export default authSlice.reducer;