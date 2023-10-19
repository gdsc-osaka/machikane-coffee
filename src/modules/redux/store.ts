import {configureStore} from '@reduxjs/toolkit'
import shopReducer from "./shop/shopsSlice";
import productReducer from "./product/productsSlice";
import orderReducer from "./order/ordersSlice";
import {useDispatch, useSelector} from "react-redux";

const store = configureStore({
    reducer: {
        shop: shopReducer,
        product: productReducer,
        order: orderReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['shops/fetchShops/fulfilled', 'products/fetchProducts/pending', 'products/fetchProducts/rejected', 'products/fetchProducts/fulfilled'],
            },
        }),
})

export default store;
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export function useAppSelector<Return>(selector: (state: RootState) => Return) {
    return useSelector(selector)
}