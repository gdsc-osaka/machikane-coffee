import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {Product} from "./types";
import {AsyncState} from "../stateType";
import {db} from "../../firebase/firebase";
import {productConverter} from "../../firebase/converters";
import {RootState} from "../store";
import {collection, doc, getDocs, runTransaction, setDoc, updateDoc} from "firebase/firestore";

const productsRef = (shopId: string) => collection(db, `shops/${shopId}/products`).withConverter(productConverter);
const productRef = (shopId: string, productId: string) => doc(db, `shops/${shopId}/products/${productId}`).withConverter(productConverter)

export const fetchProducts = createAsyncThunk("products/fetchProducts",
    async (shopId: string) => {
        // TODO: エラーハンドリング
        const snapshot = await getDocs(productsRef(shopId))

        return snapshot.docs.map(doc => doc.data());
    });

export const addProduct = createAsyncThunk('products/addProduct',
    async ({shopId, product}: {shopId: string, product: Product}, {rejectWithValue}) => {
        try {
            await setDoc(productRef(shopId, product.id), product);
        } catch (e) {
            rejectWithValue(e)
        }

        return product;
});

export const updateProduct = createAsyncThunk('products/updateProduct',
    async ({shopId, product}: {shopId: string, product: Product}, {rejectWithValue}) => {
        try {
            return runTransaction(db,async (transaction) => {
                const prodSnapshot = await transaction.get(productRef(shopId, product.id));

                if (prodSnapshot.exists()) {
                    await transaction.update(productRef(shopId, product.id), product);
                    return product;

                } else {
                    rejectWithValue(`Product ${product.id} doesn't exists!`);
                }
            });
        } catch (e) {
            rejectWithValue(e);
        }
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
export const selectAllProduct = (state: RootState) => state.product.data;
export const selectProductStatus = (state: RootState) => state.product.status;