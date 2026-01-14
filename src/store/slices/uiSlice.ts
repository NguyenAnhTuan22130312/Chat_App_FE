import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    activeSidebarTab: 'chats' | 'contacts';
    activeContactTab: 'friends' | 'groups' | 'friendRequests' | 'groupInvites' | 'hiddenGroups' | 'blocks';
}

const initialState: UiState = {
    activeSidebarTab: 'chats',
    activeContactTab: 'friends',
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActiveSidebarTab: (state, action: PayloadAction<'chats' | 'contacts'>) => {
            state.activeSidebarTab = action.payload;
        },
        setActiveContactTab: (state, action: PayloadAction<UiState['activeContactTab']>) => {
            state.activeContactTab = action.payload;
        },
    },
});

export const { setActiveSidebarTab,setActiveContactTab } = uiSlice.actions;
export default uiSlice.reducer;