import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export interface ChatMessage {
    name: string;
    type: 'people' | 'room';
    to?: string;
    mes: string;
    createAt?: string;
    id?: string;
    replyTo?: {
        senderName: string;
        message: string;
        timestamp?: string;
    };
    reactions?: Record<string, string[]>;
}

interface ChatState {
    messagesByTarget: Record<string, ChatMessage[]>;
    pinnedMessages: Record<string, ChatMessage | null>;
}

const initialState: ChatState = {
    messagesByTarget: {},
    pinnedMessages: {},
};

const sanitizeId = (key: any) => {
    if (!key) return "";
    const strKey = String(key);
    return strKey
        .replace(/\./g, '_dot_')
        .replace(/#/g, '_hash_')
        .replace(/\$/g, '_dollar_')
        .replace(/\[/g, '_bracket_open_')
        .replace(/\]/g, '_bracket_close_')
        .replace(/@/g, '_at_');
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
        addHistoryMessages: (
            state,
            action: PayloadAction<{ target: string; messages: ChatMessage[] }>
        ) => {
            const { target, messages: incomingMessages } = action.payload;
            const currentMessages = state.messagesByTarget[target] || [];

            if (incomingMessages.length === 0) return;

            const existingKeys = new Set(currentMessages.map(m => m.createAt + '_' + m.mes));

            const uniqueIncoming = incomingMessages.filter(m => !existingKeys.has(m.createAt + '_' + m.mes));

            state.messagesByTarget[target] = [...uniqueIncoming, ...currentMessages];

            console.log(`Loaded history for ${target}: added ${uniqueIncoming.length} msgs`);
            
        },

        addMessage: (
            state,
            action: PayloadAction<{ target: string; message: ChatMessage }>
        ) => {
            const { target } = action.payload;
            console.log(`REDUX: Adding message to target: "${target}"`);

            if (!state.messagesByTarget[action.payload.target]) {
                state.messagesByTarget[action.payload.target] = [];
            }
            state.messagesByTarget[action.payload.target].push(action.payload.message);
            console.log(`   -> New length for ${target}: ${state.messagesByTarget[target].length}`);
        },

        clearMessages: (state, action: PayloadAction<{ target: string }>) => {
            delete state.messagesByTarget[action.payload.target];
        },

        setPinnedMessage: (state, action: PayloadAction<{ target: string; message: ChatMessage | null }>) => {
            if (action.payload.message) {
                state.pinnedMessages[action.payload.target] = action.payload.message;
            } else {
                delete state.pinnedMessages[action.payload.target];
            }
        },
        updateAllReactions: (
            state,
            action: PayloadAction<{ target: string; reactionsData: any }>
        ) => {
            const { target, reactionsData } = action.payload;
            const messages = state.messagesByTarget[target];
            if (!messages) return;
            messages.forEach(msg => {
                const rawId = msg.id || `${msg.name}_${msg.createAt}`;
                const safeId = sanitizeId(rawId);

                if (reactionsData && reactionsData[safeId]) {
                    msg.reactions = reactionsData[safeId];
                } else {
                    msg.reactions = undefined; 
                }
            });
        },
    },
});

export const {setMessages, addMessage, clearMessages,addHistoryMessages,setPinnedMessage,updateAllReactions} = chatSlice.actions;
export default chatSlice.reducer;