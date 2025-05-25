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

const calculateTotals = (state) => {
  state.totalAmount = state.cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );
  state.totalQuantity = state.cartItems.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  state.totalShipping = state.totalAmount > 100 ? 0 : 10;
  state.totalTax = Math.round(0.15 * state.totalAmount * 100) / 100;
  state.totalPrice = state.totalAmount + state.totalShipping + state.totalTax;

  state.totalAmount = Math.round(state.totalAmount * 100) / 100;
  state.totalPrice = Math.round(state.totalPrice * 100) / 100;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.cartItems.find((item) => item.id === newItem.id);

      if (!existingItem) {
        state.cartItems.push({
          id: newItem.id,
          productName: newItem.productName,
          imgUrl: newItem.imgUrl,
          price: Number(newItem.price),
          quantity: newItem.quantity || 1,
          totalPrice: Number(newItem.price) * (newItem.quantity || 1),
          category: newItem.category || "Uncategorized",
          sellerId: newItem.sellerId || "Unknown",
        });
      } else {
        existingItem.quantity += newItem.quantity || 1;
        existingItem.totalPrice = Number(existingItem.price) * existingItem.quantity;
      }

      calculateTotals(state);
    },

    decreaseItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const existingItem = state.cartItems.find((item) => item.id === id);

      if (existingItem && existingItem.quantity > 1) {
        existingItem.quantity -= quantity;
        existingItem.totalPrice = Number(existingItem.price) * existingItem.quantity;
      }

      calculateTotals(state);
    },

    deleteItemFromCart: (state, action) => {
      const id = action.payload;
      state.cartItems = state.cartItems.filter((item) => item.id !== id);
      calculateTotals(state);
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
