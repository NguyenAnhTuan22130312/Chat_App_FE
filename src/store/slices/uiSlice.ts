import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {ChatMessage} from "./chatSlice";

interface UiState {
    activeSidebarTab: "chats" | "contacts";
    activeContactTab:
        | "friends"
        | "groups"
        | "friendRequests"
        | "groupInvites"
        | "hiddenGroups"
        | "blocks";
    replyingTo: {
        target: string | null;
        message: ChatMessage | null;
    };
    joinRoomStatus: 'idle' | 'loading' | 'success' | 'failed';
    joinRoomError: string | null;
}

const initialState: UiState = {
    activeSidebarTab: "chats",
    activeContactTab: "friends",
    replyingTo: {
        target: null,
        message: null,
    },
    joinRoomStatus: 'idle',
    joinRoomError: null,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setActiveSidebarTab: (
            state,
            action: PayloadAction<"chats" | "contacts">
        ) => {
            state.activeSidebarTab = action.payload;
        },

        setActiveContactTab: (
            state,
            action: PayloadAction<UiState["activeContactTab"]>
        ) => {
            state.activeContactTab = action.payload;
        },

        setReplyingTo: (
            state,
            action: PayloadAction<{ target: string; message: ChatMessage } | null>
        ) => {
            if (action.payload) {
                state.replyingTo = {
                    target: action.payload.target,
                    message: action.payload.message,
                };
            } else {
                state.replyingTo = {
                    target: null,
                    message: null,
                };
            }
        },

        clearReplyingTo: (state) => {
            state.replyingTo = {
                target: null,
                message: null,
            };
        },
        setJoinRoomStatus: (state, action: PayloadAction<'idle' | 'loading' | 'success' | 'failed'>) => {
            state.joinRoomStatus = action.payload;
        },
        setJoinRoomError: (state, action: PayloadAction<string | null>) => {
            state.joinRoomError = action.payload;
        },
        resetJoinRoomState: (state) => {
            state.joinRoomStatus = 'idle';
            state.joinRoomError = null;
        }
    },
});

export const {
    setActiveSidebarTab,
    setActiveContactTab,
    setReplyingTo,
    clearReplyingTo,
    setJoinRoomStatus,
    setJoinRoomError,
    resetJoinRoomState
} = uiSlice.actions;

export default uiSlice.reducer;
