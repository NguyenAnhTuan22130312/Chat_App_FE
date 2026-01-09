import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Room {
    id: number;
    name: string;
    own: string; // chủ phòng
    createTime: string;
    userList: string[]; // danh sách user trong phòng (có thể update sau)
    // chatData: any[]; // không cần lưu ở đây, để chatSlice quản lý lịch sử
}

interface RoomState {
    rooms: Room[];
    loading: boolean;
}

const initialState: RoomState = {
    rooms: [],
    loading: false,
};

const roomSlice = createSlice({
    name: 'room',
    initialState,
    reducers: {
        setRooms: (state, action: PayloadAction<Room[]>) => {
            state.rooms = action.payload;
            state.loading = false;
        },
        addRoom: (state, action: PayloadAction<Room>) => {
            // Tránh trùng
            if (!state.rooms.find(r => r.id === action.payload.id)) {
                state.rooms.push(action.payload);
            }
        },
        removeRoom: (state, action: PayloadAction<number>) => {
            state.rooms = state.rooms.filter(r => r.id !== action.payload);
        },
        setRoomLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
    },
});

export const { setRooms, addRoom, removeRoom, setRoomLoading } = roomSlice.actions;
export default roomSlice.reducer;