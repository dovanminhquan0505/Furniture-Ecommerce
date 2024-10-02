//rxslice
import { createSlice } from "@reduxjs/toolkit";

// Initialize the default state with an items array to store the products in the cart,
// along with the total quantity and total cart value.
const initialState = {
    cartItems: [], // List of products in cart
    totalAmount: 0, // Total cart value
    totalQuantity: 0, // Total quantity value
    totalShipping: 0, // Total shipping
    totalTax: 0, // Total tax
    totalPrice: 0, // Total price
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addItemToCart: (state, action) => {
            const newItem = action.payload;

            // Search for products in the cart that have the same id as the new product.
            // If found, increase the quantity and total price of the product.
            const existingItem = state.cartItems.find(
                (item) => item.id === newItem.id
            );
            state.totalQuantity++;

            if (!existingItem) {
                state.cartItems.push({
                    id: newItem.id,
                    productName: newItem.productName,
                    imgUrl: newItem.imgUrl,
                    price: newItem.price,
                    quantity: 1,
                    totalPrice: newItem.price,
                    category: newItem.category || "Uncategorized",
                });
            } else {
                existingItem.quantity++;
                existingItem.totalPrice =
                    Number(existingItem.totalPrice) + Number(newItem.price);
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) => total + Number(item.totalPrice),
                0
            );

            // Calculate totalShipping, totalTax, and totalPrice
            state.totalShipping = state.totalAmount > 100 ? 0 : 10;
            state.totalTax = Math.round((0.15 * state.totalAmount * 100) / 100);
            state.totalPrice = state.totalShipping + state.totalTax + state.totalAmount;
        },

        deleteItemFromCart: (state, action) => {
            const id = action.payload;
            const existingItem = state.cartItems.find((item) => item.id === id);

            if (existingItem) {
                state.cartItems = state.cartItems.filter(
                    (item) => item.id !== id
                );

                state.totalQuantity =
                    state.totalQuantity - existingItem.quantity;
            }

            state.totalAmount = state.cartItems.reduce(
                (total, item) =>
                    total + Number(item.price) * Number(item.quantity),
                0
            );

            // Recalculate totalShipping, totalTax, and totalPrice
            state.totalShipping = state.totalAmount > 100 ? 0 : 10;
            state.totalTax = Math.round((0.15 * state.totalAmount * 100) / 100);
            state.totalPrice = state.totalShipping + state.totalTax + state.totalAmount;
        },

        clearCart: (state) => {
            state.cartItems = [];
            state.totalAmount = 0;
            state.totalQuantity = 0;
            state.totalShipping = 0;
            state.totalTax = 0;
            state.totalPrice = 0;
        },
    },
});

//These actions will be used in components to trigger changes in state.
export const cartActions = cartSlice.actions;

//This is the reducer that will be used to manage state in the Redux store.
export default cartSlice.reducer;
