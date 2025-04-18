import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        currentUser: null,
    },
    reducers: {
        setUser: (state, action) => {
            const userPayload = action.payload;

            if (userPayload) {
                const createdAt =
                    userPayload.createdAt && userPayload.createdAt.toDate
                        ? userPayload.createdAt.toDate().toISOString()
                        : null; 

                state.currentUser = {
                    ...userPayload,
                    createdAt,
                };
            } else {
                state.currentUser = null;
            }
        },

        updateUserPhoto: (state, action) => {
            if (state.currentUser) {
                state.currentUser.photoURL = action.payload;
            }
        },

        clearUser: (state) => {
            state.currentUser = null;
        },
    },
});

export const userActions = userSlice.actions;

export default userSlice.reducer;
