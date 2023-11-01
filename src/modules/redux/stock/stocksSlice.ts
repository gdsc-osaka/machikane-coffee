import {Stock, StockForUpdate} from "./stockTypes";
import {AsyncState} from "../stateType";
import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {updateStockStatus} from "./stocksThunk";
import {Timestamp} from "firebase/firestore";

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

function mergeStock(stock: Stock, stockForUpdate: StockForUpdate): Stock {
    return {
        ...stock, ...stockForUpdate,
        created_at: (stockForUpdate.created_at instanceof Timestamp) ? stockForUpdate.created_at : stock.created_at,
        start_working_at: (stockForUpdate.start_working_at instanceof Timestamp) ? stockForUpdate.start_working_at : stock.start_working_at,
        completed_at: (stockForUpdate.completed_at instanceof Timestamp) ? stockForUpdate.completed_at : stock.completed_at,
    }
}

const stocksSlice = createSlice({
    name: 'stocks',
    initialState: {} as StockState,
    reducers: {
        stockAdded(state, action: PayloadAction<{shopId: string, stock: Stock}>) {
            const {stock, shopId} = action.payload;

            ensureInitialized(state, shopId);

            if (state[shopId].data.find(s => s.id === stock.id) === undefined) {
                state[shopId].data.push(stock);
            }
        },
        stockUpdated(state, action: PayloadAction<{shopId: string, stock: StockForUpdate}>) {
            const {stock, shopId} = action.payload;

            ensureInitialized(state, shopId);
            const oldStock = state[shopId].data.find(s => s.id === stock.id);

            if (oldStock) {
                state[shopId].data.update(e => e.id === stock.id, mergeStock(oldStock, stock));
            } else {
                state[shopId].data.push(stock as Stock);
            }
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
    extraReducers: (builder) => {
        builder.addCase(updateStockStatus.fulfilled, (state, action) => {
            const {shopId, stock} = action.payload;

            ensureInitialized(state, shopId);
            const oldStock = state[shopId].data.find(s => s.id === stock.id);

            if (oldStock) {
                state[shopId].data.update(e => e.id === stock.id, mergeStock(oldStock, stock));
            }
        })
    }
});

export const {stockAdded, stockUpdated, stockRemoved, stockSucceeded, stockIdle} = stocksSlice.actions;

const stockReducer = stocksSlice.reducer;
export default stockReducer;