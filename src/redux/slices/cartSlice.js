//rxslice
import { createSlice } from "@reduxjs/toolkit";

// Initialize the default state with an items array to store the products in the cart,
// along with the total quantity and total cart value.
const initialState = {
    cartItems: [], // List of products in cart
    totalAmount: 0, // Total cart value
    totalQuantity: 0, // Total quantity value
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItemToCart: (state, action) => {
            const newItem = action.payload;
            const existingItem = state.cartItems.find(
                (item) => item.id === newItem.id
            );

            state.totalQuantity++;

            if (!existingItem) {
                state.cartItems.push({
                    id: newItem.id,
                    name: newItem.productName,
                    image: newItem.image,
                    price: newItem.price,
                    quantity: 1,
                    totalPrice: newItem.price,
                });
            } else {
                existingItem.quantity++;
                existingItem.totalPrice =
                    Number(existingItem.totalPrice) + Number(newItem.price);
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) =>
                    total + Number(item.price) * Number(item.quantity)
            );
        },
    },
});

//These actions will be used in components to trigger changes in state.
export const cartActions = cartSlice.actions;

//This is the reducer that will be used to manage state in the Redux store.
export default cartSlice.reducer;
