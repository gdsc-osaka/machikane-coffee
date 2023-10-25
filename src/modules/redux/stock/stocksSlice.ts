import {Stock} from "./stockTypes";
import {AsyncState} from "../stateType";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

type SingleStockState = AsyncState<Stock[]>;

const initialSingleStockState: SingleStockState = {
    data: [],
    error: "",
    status: "idle",
}

type StockState = {
    [shopId in string]: SingleStockState
}

function ensureInitialized(state: any, shopId: string) {
    if (!state.hasOwnProperty(shopId)) {
        state[shopId] = Object.assign({}, initialSingleStockState);
    }
}

const stocksSlice = createSlice({
    name: 'stocks',
    initialState: {} as StockState,
    reducers: {
        stockAdded(state, action: PayloadAction<{shopId: string, stock: Stock}>) {
            const {stock, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.push(stock);
        },
        stockUpdated(state, action: PayloadAction<{shopId: string, stock: Stock}>) {
            const {stock, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.update(e => e.id === stock.id, stock);
        },
        stockRemoved(state, action: PayloadAction<{shopId: string, stockId: string}>) {
            const {stockId, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.remove(e => e.id === stockId);
        },
        stockSucceeded(state, action: PayloadAction<{ shopId: string }>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].status = 'succeeded';
        },
        stockIdle(state, action: PayloadAction<{ shopId: string }>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].status = 'idle';
        }

    },
    extraReducers: {}
});

export const {stockAdded, stockUpdated, stockRemoved, stockSucceeded, stockIdle} = stocksSlice.actions;

const stockReducer = stocksSlice.reducer;
export default stockReducer;