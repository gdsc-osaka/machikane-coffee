import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {Product} from "./types";
import {AsyncState} from "../stateType";
import {db} from "../../firebase/firebase";
import {productConverter} from "../../firebase/converters";
import {RootState} from "../store";

export const fetchProducts = createAsyncThunk("products/fetchProducts",
    async (shopId: string) => {
        const shopRef = db.collection("shops").doc(shopId);
        // TODO: エラーハンドリング
        const snapshot = await shopRef
            .collection("products")
            .withConverter(productConverter)
            .get();

        return snapshot.docs.map(doc => doc.data());
    });

export const addProduct = createAsyncThunk('products/addProduct',
    async ({shopId, product}: {shopId: string, product: Product}) => {
        const shopRef = db.collection("shops").doc(shopId);
        // TODO: エラーハンドリング
        await shopRef.collection('products').doc(product.id).withConverter(productConverter).set(product);

        return product;
});

export const updateProduct = createAsyncThunk('products/updateProduct',
    async ({shopId, product}: {shopId: string, product: Product}, {rejectWithValue}) => {
        const shopRef = db.collection('shops').doc(shopId);
        const prodRef = shopRef.collection('products').doc(product.id);

        return db.runTransaction(async (transaction) => {
            const prodSnapshot = await transaction.get(prodRef);

            if (prodSnapshot.exists) {
                await prodRef.withConverter(productConverter).update(product);
                return product;

            } else {
                rejectWithValue(`Product ${product.id} doesn't exists!`);
            }
        });
    })

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
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })

        builder
            .addCase(addProduct.fulfilled, (state, action) => {
                state.data.push(action.payload);
            })

        builder
            .addCase(updateProduct.fulfilled, (state, action) => {
                const updatedProd = action.payload;

                // state.data の要素を更新
                if (updatedProd != undefined) {
                    state.data.update(e => e.id == updatedProd.id, updatedProd);
                }
            })
    },
});

const productReducer = productsSlice.reducer;
export default productReducer;

export const selectProductById = (state: RootState, productId: string) => state.product.data.find(e => e.id == productId) ?? null