// src/store/slices/currentChatSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PartnerType = 'people' | 'room';

interface CurrentChatState {
    name: string | null;
    type: PartnerType | null;
}

const initialState: CurrentChatState = {
    name: null,
    type: null,
};

const currentChatSlice = createSlice({
    name: 'currentChat',
    initialState,
    reducers: {
        setCurrentChat: (state, action: PayloadAction<{ name: string; type: PartnerType }>) => {
            state.name = action.payload.name;
            state.type = action.payload.type;
        },
        clearCurrentChat: (state) => {
            state.name = null;
            state.type = null;
        },
    },
});

export const { setCurrentChat, clearCurrentChat } = currentChatSlice.actions;
export default currentChatSlice.reducer;