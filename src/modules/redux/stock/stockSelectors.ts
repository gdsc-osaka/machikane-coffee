import {RootState} from "../store";
import {Stock} from "./stockTypes";

export function selectStockStatus(state: RootState, shopId: string) {
    return state.stock[shopId]?.status ?? 'idle';
}

export function selectAllStocks(state: RootState, shopId: string) {
    return state.stock[shopId]?.data ?? [];
}

function sortByWorking(a: Stock, b: Stock) {
    if (a.status === b.status) {
        return 0;
    }

    if (a.status === "working") {
        return -1;
    } else {
        return 1;
    }
}

export function selectIdleOrWorkingStocks(state: RootState, shopId: string) {
    return selectAllStocks(state, shopId).filter(s => s.status === 'idle' || s.status === 'working').sort(sortByWorking);
}