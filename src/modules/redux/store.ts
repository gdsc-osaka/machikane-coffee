import { configureStore } from '@reduxjs/toolkit'
import shopReducer from "./shop/shopsSlice";
import productReducer from "./product/productsSlice";
import orderReducer from "./order/ordersSlice";

const store = configureStore({
    reducer: {
        shop: shopReducer,
        product: productReducer,
        order: orderReducer
    }
})

export default store;
export type RootState = ReturnType<typeof store.getState>