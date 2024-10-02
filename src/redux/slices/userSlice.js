import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        currentUser: null,
    },
    reducers: {
        setUser: (state, action) => {
            state.currentUser = action.payload;
        },

        updateUserPhoto: (state, action) => {
            if (state.currentUser) {
                state.currentUser.photoURL = action.payload;
            }
        },
    },
});

export const userActions = userSlice.actions;

export default userSlice.reducer;
