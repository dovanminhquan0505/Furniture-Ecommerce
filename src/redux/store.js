import { configureStore, combineReducers } from "@reduxjs/toolkit"; 
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; 
import cartSlice from "./slices/cartSlice";
import wishListSlice from "./slices/wishListSlice";
import userSlice from "./slices/userSlice";

const persistConfig = {
    key: "root",
    storage,
};

const rootReducer = {
    cart: cartSlice,
    wishlist: wishListSlice,
    user: userSlice,
};

const combinedReducer = combineReducers(rootReducer);

const persistedReducer = persistReducer(persistConfig, combinedReducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'user/setUser'],
                ignoredActionPaths: ['payload.createdAt'],
                ignoredPaths: ['user.createdAt'],
            },
        }),
});

export const persistor = persistStore(store);

export default store;