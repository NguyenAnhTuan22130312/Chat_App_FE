import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SearchState {
    isSearching: boolean;           // Đang chờ server trả lời?
    searchResult: boolean | null;   // true: Tồn tại, false: Không tồn tại, null: Chưa tìm
    searchedUsername: string;       // Lưu lại tên vừa tìm để UI so sánh
}

const initialState: SearchState = {
    isSearching: false,
    searchResult: null,
    searchedUsername: '',
};

const searchSlice = createSlice({
    name: "search",
    initialState,
    reducers: {
        // Gọi khi bắt đầu nhấn Enter
        startSearching: (state, action: PayloadAction<string>) => {
            state.isSearching = true;
            state.searchResult = null; // Reset kết quả cũ
            state.searchedUsername = action.payload;
        },
        // Gọi khi Socket nhận được phản hồi
        setSearchResult: (state, action: PayloadAction<boolean>) => {
            state.isSearching = false;
            state.searchResult = action.payload;
        },
        // Reset khi xóa ô search
        clearSearch: (state) => {
            state.isSearching = false;
            state.searchResult = null;
            state.searchedUsername = '';
        },
    },
});

export const { startSearching, setSearchResult, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;