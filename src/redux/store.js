import { configureStore } from "@reduxjs/toolkit";
import cartSlice from "./slices/cartSlice";
import wishListSlice from "./slices/wishListSlice";
import userSlice from "./slices/userSlice";

const store = configureStore({
    reducer: {
        cart: cartSlice,
        wishlist: wishListSlice,
        user: userSlice,
    },
});

export default store;
