import { configureStore } from '@reduxjs/toolkit'
import shopReducer from "./shop/shopSlice";

export default configureStore({
    reducer: {
        shop: shopReducer
    }
})