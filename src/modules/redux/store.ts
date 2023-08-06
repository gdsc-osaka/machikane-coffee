import { configureStore } from '@reduxjs/toolkit'
import shopReducer from "./shop/shopSlice";
import productReducer from "./product/productsSlice";

const store = configureStore({
    reducer: {
        shop: shopReducer,
        product: productReducer,
    }
})

export default store;
export type RootState = ReturnType<typeof store.getState>