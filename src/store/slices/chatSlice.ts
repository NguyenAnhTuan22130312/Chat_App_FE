import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  name: string; 
  mes: string;
  to?: string;
  createAt?: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentPartner: string;
}

const initialState: ChatState = {
  messages: [],
  currentPartner: "anhtuan12",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {

    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload; 
    },

    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload);
    },

    // Đổi người chat (sau này mở rộng chat với người khác)
    setCurrentPartner: (state, action: PayloadAction<string>) => {
        state.currentPartner = action.payload;
        // Khi đổi người thì clear tin nhắn cũ đi cho sạch
        state.messages = [];
    }
  },
});

export const { setMessages, addMessage, setCurrentPartner } = chatSlice.actions;
export default chatSlice.reducer;