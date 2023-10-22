import {Stock} from "./stockTypes";
import {AsyncState} from "../stateType";
import {createSlice} from "@reduxjs/toolkit";

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
    reducers: {},
    extraReducers: {}
});