import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UnreadState {
    // Key là tên user/phòng, Value là số tin nhắn chưa đọc
    unreadCounts: Record<string, number>;
}

const initialState: UnreadState = {
    unreadCounts: {},
};

const unreadSlice = createSlice({
    name: 'unread',
    initialState,
    reducers: {
        // Gọi hàm này khi nhận event SEND_CHAT
        increaseUnread: (state, action: PayloadAction<string>) => {
            const partnerName = action.payload;
            if (state.unreadCounts[partnerName]) {
                state.unreadCounts[partnerName] += 1;
            } else {
                state.unreadCounts[partnerName] = 1;
            }
        },
        // Gọi hàm này khi click vào chat
        clearUnread: (state, action: PayloadAction<string>) => {
            const partnerName = action.payload;
            // Xoá key khỏi object
            if (state.unreadCounts[partnerName]) {
                delete state.unreadCounts[partnerName];
            }
        },
        clearAllUnread: (state) => {
            state.unreadCounts = {};
        },
    },
});

export const { increaseUnread, clearUnread, clearAllUnread } = unreadSlice.actions;
export default unreadSlice.reducer;