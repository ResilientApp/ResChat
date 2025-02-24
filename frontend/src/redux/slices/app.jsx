import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    sidebar: {
        open: false,
        type: "CONTACT", // can be CONTACT, STARRED, SHARED
    }
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
        }
    }
});

export const { toggleSidebar, updateSidebarType } = slice.actions;
export const appReducer = slice.reducer;