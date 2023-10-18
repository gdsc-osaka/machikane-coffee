import {createSlice} from "@reduxjs/toolkit";
import {Product} from "./productTypes";
import {AsyncState} from "../stateType";
import {RootState} from "../store";
import {addProduct, fetchProducts, updateProduct} from "./productsThunk";

const productsSlice = createSlice({
    name: "products",
    initialState: {
        data: [],
        status: 'idle',
        error: undefined,
    } as AsyncState<Product[]>,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed'
                state.error = action.error.message;
            })

        builder
            .addCase(addProduct.fulfilled, (state, action) => {
                const product = action.payload;

                if (product !== undefined) {
                    state.data.push();
                }
            })

        builder
            .addCase(updateProduct.fulfilled, (state, action) => {
                const updatedProd = action.payload;

                // state.data の要素を更新
                if (updatedProd !== undefined) {
                    state.data.update(e => e.id === updatedProd.id, updatedProd);
                }
            })
    },
});

const productReducer = productsSlice.reducer;
export default productReducer;

export const selectProductById = (state: RootState, productId: string) => state.product.data.find(e => e.id === productId) ?? null
export const selectAllProduct = (state: RootState) => state.product.data;
export const selectProductStatus = (state: RootState) => state.product.status;