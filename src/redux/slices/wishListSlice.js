import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    wishListItems: [],
    totalQuantity: 0,
    error: null,
};

const wishListSlice = createSlice({
    name: "wishlist",
    initialState,
    reducers: {
        addToWishList: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.wishListItems.find(item => item.id === newItem.id);
            
            if (!existingItem) {
                state.wishListItems.push({
                    ...newItem,
                    quantity: 1
                });
                state.totalQuantity++;
                state.error = null;
            } else {
                // If product is saved into the wish list, then inform error for user
                state.error = "Product already in wish list!"; 
            }
        },

        removeFromWishList: (state, action) => {
            const id = action.payload; 
            const existingItem = state.wishListItems.find((item) => item.id === id);
            if (existingItem) {
                state.wishListItems = state.wishListItems.filter(
                    (item) => item.id !== id
                );

                state.totalQuantity =
                    state.totalQuantity - existingItem.quantity;
                state.error = null;
            }
        },

        clearWishList: (state) => {
            state.wishListItems = [];
            state.totalQuantity = 0;
            state.error = null;
        },
    },
});

export const wishListActions = wishListSlice.actions;

export default wishListSlice.reducer;
