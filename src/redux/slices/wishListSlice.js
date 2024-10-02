import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    wishListItems: [],
    totalQuantity: 0,
};

const wishListSlice = createSlice({
    name: "wishlist",
    initialState,
    reducers: {
        addToWishList: (state, action) => {
            const newItem = action.payload;
            
            // Check if the item is already in the wish list and is an array
            if (Array.isArray(state.wishListItems)) {
                const existingItem = state.wishListItems.find(item => item.id === newItem.id);

                if (!existingItem) {
                    state.wishListItems.push({
                        ...newItem,
                        quantity: 1
                    });
                    state.totalQuantity++;
                } else {
                    existingItem.quantity++;
                    state.totalQuantity++;
                }
            } else {
                // Initial array if wishListItems is not an array.
                state.wishListItems = [{ ...newItem, quantity: 1 }];
                state.totalQuantity = 1;
            }
        },

        removeFromWishList: (state, action) => {
            const id = action.payload;
            const existingItem = state.wishListItems.find((item) => item.id === id);
            if (existingItem) {
                state.totalQuantity -= existingItem.quantity;
                state.wishListItems = state.wishListItems.filter(
                    (item) => item.id !== id
                );
            }
        },

        clearWishList: (state) => {
            state.wishListItems = [];
            state.totalQuantity = 0;
            state.totalAmount = 0;
        },
    },
});

export const wishListActions = wishListSlice.actions;

export default wishListSlice.reducer;
