import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./slices/cartSlice";
import wishListSlice from "./slices/wishListSlice";
import userSlice from "./slices/userSlice";
import { saveToLocalStorage, loadFromLocalStorage } from "../utils/localStorage";

// Load state from local storage on app load
const preloadedState = loadFromLocalStorage();

const store = configureStore({
    reducer: {
        cart: cartSlice,
        wishlist: wishListSlice,
        user: userSlice,
    },
    preloadedState,
});

// Save state to local storage on every state change
store.subscribe(() => {
    saveToLocalStorage(store.getState());
})

export default store;
