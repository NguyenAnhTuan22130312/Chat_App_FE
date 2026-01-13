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

export const {setMessages, addMessage, clearMessages} = chatSlice.actions;
export default chatSlice.reducer;