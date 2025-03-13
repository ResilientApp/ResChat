import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sidebar: {
        open: false,
        type: "CONTACT", // can be CONTACT, STARRED, SHARED
    },
    username: null,
};

const slice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        toggleSidebar(state) {
            state.sidebar.open = !state.sidebar.open;
        },
        updateSidebarType(state, action) {
            state.sidebar.type = action.payload.type;
        },
        setSelectedFriend(state, action) {
            state.selectedFriend = action.payload;
          },
        setChatHistory(state, action) {
        state.chatHistory = action.payload;
        },
        setUsername(state, action) {
            state.username = action.payload;
        }
    }
});

export const { toggleSidebar, updateSidebarType, setSelectedFriend, setChatHistory, setUsername } = slice.actions;
export const appReducer = slice.reducer;