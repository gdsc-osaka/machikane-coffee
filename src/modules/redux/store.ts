import { configureStore } from '@reduxjs/toolkit'
import shopReducer from "./shop/shopsSlice";
import productReducer from "./product/productsSlice";
import orderReducer from "./order/ordersSlice";
import {useDispatch} from "react-redux";

const store = configureStore({
    reducer: {
        shop: shopReducer,
        product: productReducer,
        order: orderReducer
    }
})

export default store;
export type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()