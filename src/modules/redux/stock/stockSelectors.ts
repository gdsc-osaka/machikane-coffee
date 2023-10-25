import {RootState} from "../store";

export function selectStockStatus(state: RootState, shopId: string) {
    return state.stock[shopId]?.status ?? 'idle';
}

export function selectAllStocks(state: RootState, shopId: string) {
    return state.stock[shopId]?.data ?? [];
}