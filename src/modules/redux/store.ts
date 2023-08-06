import { configureStore } from '@reduxjs/toolkit'
import shopReducer from "./shop/shopSlice";
import productReducer from "./product/productsSlice";

export default configureStore({
    reducer: {
        shop: shopReducer,
        product: productReducer,
    }
})