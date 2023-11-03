import {RootState} from "../store";
import {Order} from "./orderTypes";
import {selectAllProducts} from "../product/productsSlice";
import {isOrderCompleted} from "../../util/orderUtils";

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
/**
 * 完成済みの注文を取得する
 */
export const selectCompletedOrders = (state: RootState, shopId: string) => {
    const products = selectAllProducts(state, shopId);

    return selectAllOrders(state, shopId)
        .filter(order => order.status !== 'received' && isOrderCompleted(order, products, "required_product_amount"))
        .sort((a, b) => sortByCreated(b, a));
}