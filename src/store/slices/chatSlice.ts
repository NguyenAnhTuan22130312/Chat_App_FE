import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface ChatMessage {
    // name: string;
    // mes: string;
    // to?: string;
    // createAt?: string;

    name: string;
    type: 'people' | 'room';
    to?: string;
    mes: string;
    createAt?: string;
    id?: string;
}

interface ChatState {
    messagesByTarget: Record<string, ChatMessage[]>;
}

const initialState: ChatState = {
    messagesByTarget: {},
};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        setMessages: (
            state,
            action: PayloadAction<{ target: string; messages: ChatMessage[] }>
        ) => {
            state.messagesByTarget[action.payload.target] = action.payload.messages;
        },
        // --- ACTION MỚI: Dùng cho load more (Phân trang) ---
        addHistoryMessages: (
            state,
            action: PayloadAction<{ target: string; messages: ChatMessage[] }>
        ) => {
            const { target, messages: incomingMessages } = action.payload;
            const currentMessages = state.messagesByTarget[target] || [];

            if (incomingMessages.length === 0) return;

            // 1. Lọc trùng lặp (Dùng createAt + mes làm key tạm nếu ko có id)
            // Set chứa các tin nhắn hiện tại để check
            const existingKeys = new Set(currentMessages.map(m => m.createAt + '_' + m.mes));

            // Chỉ lấy những tin nhắn chưa tồn tại
            const uniqueIncoming = incomingMessages.filter(m => !existingKeys.has(m.createAt + '_' + m.mes));

            // 2. Gộp: [Tin Cũ Vừa Load] + [Tin Hiện Tại]
            state.messagesByTarget[target] = [...uniqueIncoming, ...currentMessages];

            console.log(`📜 Loaded history for ${target}: added ${uniqueIncoming.length} msgs`);
        },

        addMessage: (
            state,
            action: PayloadAction<{ target: string; message: ChatMessage }>
        ) => {
            const { target, message } = action.payload;
            console.log(`📦 REDUX: Adding message to target: "${target}"`);

            if (!state.messagesByTarget[action.payload.target]) {
                state.messagesByTarget[action.payload.target] = [];
            }
            state.messagesByTarget[action.payload.target].push(action.payload.message);
            console.log(`   -> New length for ${target}: ${state.messagesByTarget[target].length}`);
        },

        clearMessages: (state, action: PayloadAction<{ target: string }>) => {
            delete state.messagesByTarget[action.payload.target];
        },
    },
});

export const {setMessages, addMessage, clearMessages,addHistoryMessages} = chatSlice.actions;
export default chatSlice.reducer;