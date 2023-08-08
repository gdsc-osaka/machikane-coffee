import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {Product} from "./types";
import {AsyncState} from "../stateType";
import {db} from "../../firebase/firebase";
import {productConverter} from "../../firebase/converters";
import {RootState} from "../store";

export const fetchProducts = createAsyncThunk("products/fetchProducts",
    async (shopId: string) => {
        const shopRef = db.collection("shops").doc(shopId);
        const snapshot = await shopRef
            .collection("products")
            .withConverter(productConverter)
            .get();

        return snapshot.docs.map(doc => doc.data());
    });

const productsSlice = createSlice({
    name: "products",
    initialState: {
        data: [],
        status: 'idle',
        error: null,
    } as AsyncState<Product[]>,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchProducts.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })
    },
});

const productReducer = productsSlice.reducer;
export default productReducer;

export const selectProductById = (state: RootState, productId: string) => state.product.data.find(e => e.id == productId) ?? null