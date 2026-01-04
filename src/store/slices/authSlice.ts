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
}

// State ban đầu khi project khởi động
const initialState: AuthState = {
    user: localStorage.getItem('username') ? { username: localStorage.getItem('username')! } : null,
    isAuthenticated: !!localStorage.getItem('reLoginCode'), // True nếu có reLoginCode
    reLoginCode: localStorage.getItem('reLoginCode'),
    loading: false,
    error: null,
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

        // Đăng ký thành công
        // Auto chuyển sang trạng thái đã đăng nhập hoặc yêu cầu login
        registerSuccess: (state, action: PayloadAction<{ user: User; reLoginCode?: string }>) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;

            if (action.payload.reLoginCode) {
                state.reLoginCode = action.payload.reLoginCode;
                localStorage.setItem('reLoginCode', action.payload.reLoginCode);
                localStorage.setItem('username', action.payload.user.username);
            }
            state.error = null;
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
    },
});

// Export actions dùng cho components
export const {
    loginRequest,
    loginSuccess,
    loginFailure,
    registerSuccess,
    logout,
    clearError,
} = authSlice.actions;

// Export reducer để add vào store
export default authSlice.reducer;