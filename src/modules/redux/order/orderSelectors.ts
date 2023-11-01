import {RootState} from "../store";
import {Order} from "./orderTypes";
import {selectAllProducts} from "../product/productsSlice";
import {Product} from "../product/productTypes";
import {isOrderCompleted} from "../../util/orderUtils";

/**
 * createdが新しい方が先にソートする
 * @param a
 * @param b
 */
function sortByCreated(a: Order, b: Order) {
    return b.created_at.toDate().getTime() - a.created_at.toDate().getTime()
}

function sortByCompleted(a: Order, b: Order, products: Product[]) {
    return (isOrderCompleted(b, products) ? 1 : 0) - (isOrderCompleted(a, products) ? 1 : 0)
}

export const selectAllOrders = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort(sortByCreated) ?? [];
export const selectAllOrdersByCompleted = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort(sortByCreated).sort((a, b) => sortByCompleted(a, b, selectAllProducts(state, shopId))) ?? [];
export const selectAllOrdersInverse = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort((a, b) => sortByCreated(b, a)) ?? [];
/**
 * 自分以前のstatus==idleなOrderを返す. myOrderがundefinedの場合は空配列を返す.
 */
export const selectAllIdleOrdersBeforeMe = (state: RootState, shopId: string, myOrder?: Order) => {
    const createdAtTime = myOrder?.created_at.toDate().getTime() ?? 0;

    return selectAllOrders(state, shopId).filter(o => o.status === "idle" && o.created_at.toDate().getTime() - createdAtTime < 0);
}
export const selectOrderStatus = (state: RootState, shopId: string) =>
    state.order[shopId]?.status ?? 'idle';
export const selectOrderById = (state: RootState, shopId: string, orderId: string) =>
    state.order[shopId]?.data.find(e => e.id === orderId);
export const selectReceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrders(state, shopId).filter(e => e.status === "received");
export const selectUnreceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrdersByCompleted(state, shopId).filter(e => e.status !== "received");
/**
 * streamOrdersのunsubscribeを取得
 */
export const selectOrderUnsubscribe = (state: RootState, shopId: string) =>
    state.order[shopId]?.unsubscribe ?? null;
/**
 * 注文番号と一致する注文を返す
 * WARN: 日時の条件が入ってない
 */
export const selectOrderByIndex = (state: RootState, shopId: string, index: number) =>
    state.order[shopId]?.data.find(e => e.index === index);