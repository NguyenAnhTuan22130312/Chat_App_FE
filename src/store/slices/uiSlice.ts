import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChatMessage } from "./chatSlice";

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
}

const initialState: UiState = {
  activeSidebarTab: "chats",
  activeContactTab: "friends",
  replyingTo: {
    target: null,
    message: null,
  },
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
  },
});

export const {
  setActiveSidebarTab,
  setActiveContactTab,
  setReplyingTo,
  clearReplyingTo,
} = uiSlice.actions;

export default uiSlice.reducer;
