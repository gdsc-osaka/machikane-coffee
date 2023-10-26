import {createSlice, PayloadAction, SerializedError} from "@reduxjs/toolkit";
import {Product} from "./productTypes";
import {AsyncState, Unsubscribe} from "../stateType";
import {RootState} from "../store";
import {addProduct, fetchProducts, updateProduct} from "./productsThunk";

type SingleProductState = AsyncState<Product[]> & Unsubscribe;

const initialSingleProductState: SingleProductState = {
    data: [],
    error: "",
    status: "idle",
    unsubscribe: null
}

type ProductState = {
    [shopId in string]: SingleProductState
}

function ensureInitialized(state: any, shopId: string) {
    if (!state.hasOwnProperty(shopId)) state[shopId] = Object.assign({}, initialSingleProductState);
}

const productsSlice = createSlice({
    name: "products",
    initialState: {} as ProductState,
    reducers: {
        productAdded(state, action: PayloadAction<{ shopId: string, product: Product }>) {
            const {product, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.push(product);
        },
        productUpdated(state, action: PayloadAction<{ shopId: string, product: Product }>) {
            const {product, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.update(d => d.id === product.id, product);
        },
        /**
         * 指定した ID の product を消去する
         * @param state
         * @param action 消去する product の ID
         */
        productRemoved(state, action: PayloadAction<{ shopId: string, productId: string }>) {
            const {shopId, productId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.remove(d => d.id === productId);
        },
        /**
         * OrderStateをshopIdのマップとしたため、extraReducerのpendingでloadingに設定することができない(shopIdがとってこれないため)
         * このため、OrderのAsyncThunkではこのReducerを使う
         * @param state
         * @param action
         */
        productPending(state, action: PayloadAction<{ shopId: string }>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'loading';
        },
        /**
         * pendingと同様の理由で, OrderのAsyncThunkではproductRejectedを用いる
         * @param state
         * @param action
         */
        productRejected(state, action: PayloadAction<{ shopId: string, error: SerializedError }>) {
            const {shopId, error} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'failed';
            state[shopId].error = error.message;
        },
        /**
         * pendingと同様の理由で, OrderのAsyncThunkではproductSucceededを用いる
         * @param state
         * @param action
         */
        productSucceeded(state, action: PayloadAction<{ shopId: string }>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'succeeded';
        },
        productIdle(state, action: PayloadAction<{ shopId: string }>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'idle';
        }
    },
    extraReducers: builder => {
        builder.addCase(fetchProducts.fulfilled, (state, action) => {
            const {shopId, products} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'succeeded';
            state[shopId].data = products;
        })

        builder.addCase(addProduct.fulfilled, (state, action) => {
            const {shopId, product} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].data.push(product);
        })

        builder.addCase(updateProduct.fulfilled, (state, action) => {
            if (action.payload === undefined) return;

            const {shopId, product} = action.payload;

            state[shopId].data.update(e => e.id === product.id, product);
        })
    },
});

const productReducer = productsSlice.reducer;
export const {
    productAdded,
    productUpdated,
    productRemoved,
    productRejected,
    productPending,
    productSucceeded,
    productIdle
} = productsSlice.actions;

export default productReducer;

export const selectProductById = (state: RootState, shopId: string, productId: string) =>
    state.product[shopId]?.data.find(e => e.id === productId) ?? null
export const selectAllProduct = (state: RootState, shopId: string) =>
    state.product[shopId]?.data ?? [];
export const selectProductStatus = (state: RootState, shopId: string) =>
    state.product[shopId]?.status ?? "idle";