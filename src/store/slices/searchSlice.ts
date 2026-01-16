import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SearchState {
    isSearching: boolean;
    searchResult: boolean | null;
    searchedUsername: string;
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
        startSearching: (state, action: PayloadAction<string>) => {
            state.isSearching = true;
            state.searchResult = null;
            state.searchedUsername = action.payload;
        },
        setSearchResult: (state, action: PayloadAction<boolean>) => {
            state.isSearching = false;
            state.searchResult = action.payload;
        },
        clearSearch: (state) => {
            state.isSearching = false;
            state.searchResult = null;
            state.searchedUsername = '';
        },
    },
});

export const { startSearching, setSearchResult, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;