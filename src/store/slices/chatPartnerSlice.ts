import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PartnerType = 'people' | 'room';

export interface ChatPartner {
    name: string;
    type: PartnerType;        // 'people' nếu type === 0, 'room' nếu type === 1
    actionTime?: string;      // thời gian hoạt động cuối, dùng để sort
    isOnline?: boolean;       // chỉ áp dụng cho people
}

interface ChatPartnerState {
    partners: ChatPartner[];
    loading: boolean;
}

const initialState: ChatPartnerState = {
    partners: [],
    loading: false,
};

const chatPartnerSlice = createSlice({
    name: 'chatPartner',
    initialState,
    reducers: {
        setPartners: (state, action: PayloadAction<ChatPartner[]>) => {
            state.partners = action.payload;
            state.loading = false;
        },
        updatePartnerOnline: (state, action: PayloadAction<{ name: string; isOnline: boolean }>) => {
            const partner = state.partners.find(p => p.name === action.payload.name && p.type === 'people');
            if (partner) {
                partner.isOnline = action.payload.isOnline;
            }
        },
        setPartnersLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setPartners, updatePartnerOnline, setPartnersLoading } = chatPartnerSlice.actions;
export default chatPartnerSlice.reducer;