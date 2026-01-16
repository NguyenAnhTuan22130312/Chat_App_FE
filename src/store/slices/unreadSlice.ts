import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UnreadState {
    unreadCounts: Record<string, number>;
}

const initialState: UnreadState = {
    unreadCounts: {},
};

const unreadSlice = createSlice({
    name: 'unread',
    initialState,
    reducers: {
        increaseUnread: (state, action: PayloadAction<string>) => {
            const partnerName = action.payload;
            if (state.unreadCounts[partnerName]) {
                state.unreadCounts[partnerName] += 1;
            } else {
                state.unreadCounts[partnerName] = 1;
            }
        },
        clearUnread: (state, action: PayloadAction<string>) => {
            const partnerName = action.payload;
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