import {RootState} from "../store";
import {Order} from "./orderTypes";

/**
 * createdが新しい方が先にソートする
 * @param a
 * @param b
 */
function sortByCreated(a: Order, b: Order) {
    return b.created_at.toMillis() - a.created_at.toMillis()
}

// function sortByCompleted(a: Order, b: Order, products: Product[]) {
//     return (isOrderCompleted(b, products) ? 1 : 0) - (isOrderCompleted(a, products) ? 1 : 0)
// }

export const selectAllOrders = (state: RootState, shopId: string) => state.order[shopId]?.data.slice() ?? [];
export const selectOrderStatus = (state: RootState, shopId: string) => state.order[shopId]?.status ?? 'idle';
export const selectOrderById = (state: RootState, shopId: string, orderId: string) => state.order[shopId]?.data.find(e => e.id === orderId);
export const selectReceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrders(state, shopId).filter(e => e.status === "received").sort(sortByCreated);
export const selectUnreceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrders(state, shopId).filter(e => e.status !== "received").sort((a, b) => sortByCreated(b, a));