import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    activeSidebarTab: 'chats' | 'contacts'; // Tab đang chọn
}

const initialState: UiState = {
    activeSidebarTab: 'chats',
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActiveSidebarTab: (state, action: PayloadAction<'chats' | 'contacts'>) => {
            state.activeSidebarTab = action.payload;
        },
    },
});

export const { setActiveSidebarTab } = uiSlice.actions;
export default uiSlice.reducer;