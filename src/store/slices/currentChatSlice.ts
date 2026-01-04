import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrentChatState {
    type: 'room' | 'people' | null;
    name: string | null;
}

const initialState: CurrentChatState = {
    type: null,
    name: null,
};

const currentChatSlice = createSlice({
    name: 'currentChat',
    initialState,
    reducers: {
        setCurrentChat: (state, action: PayloadAction<{ type: 'room' | 'people'; name: string }>) => {
            state.type = action.payload.type;
            state.name = action.payload.name;
        },
    },
});

export const { setCurrentChat } = currentChatSlice.actions;
export default currentChatSlice.reducer;