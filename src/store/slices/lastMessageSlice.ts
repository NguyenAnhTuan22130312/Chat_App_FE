// src/store/slices/lastMessageSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LastMessage {
    partnerName: string;
    message: string;
    timestamp: string; // createAt từ server
    senderName?: string; // optional, để hiển thị "Bạn: " hoặc tên người gửi
}

interface LastMessageState {
    messages: Record<string, LastMessage>; // key: partnerName
}

const initialState: LastMessageState = {
    messages: {},
};

const lastMessageSlice = createSlice({
    name: 'lastMessage',
    initialState,
    reducers: {
        setLastMessage: (state, action: PayloadAction<LastMessage>) => {
            const { partnerName } = action.payload;
            state.messages[partnerName] = action.payload;
        },
        clearLastMessages: (state) => {
            state.messages = {};
        },
    },
});

export const { setLastMessage, clearLastMessages } = lastMessageSlice.actions;
export default lastMessageSlice.reducer;