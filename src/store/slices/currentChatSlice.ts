import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PartnerType = 'people' | 'room';

interface CurrentChatState {
    name: string | null;
    type: PartnerType | null;
    userList: Array<{ id?: number; name: string }> | null;
}

const initialState: CurrentChatState = {
    name: null,
    type: null,
    userList: [],
};

const currentChatSlice = createSlice({
    name: 'currentChat',
    initialState,
    reducers: {
        setCurrentChat: (state, action: PayloadAction<{ name: string; type: PartnerType }>) => {
            state.name = action.payload.name;
            state.type = action.payload.type;
            state.userList = [];
        },
        setRoomMembers: (state, action: PayloadAction<Array<{ id?: number; name: string }>>) => {
            state.userList = action.payload;
        },
        clearCurrentChat: (state) => {
            state.name = null;
            state.type = null;
            state.userList = [];
        },
    },
});

export const { setCurrentChat, clearCurrentChat, setRoomMembers } = currentChatSlice.actions;
export default currentChatSlice.reducer;