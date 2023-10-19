import {createSlice, PayloadAction, SerializedError} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {Order} from "./orderTypes";
import {RootState} from "../store";
import {deleteOrder, fetchOrders, streamOrder, updateOrder} from "./ordersThunk";

// それぞれのショップごとのOrderState
type SingleOrderState = AsyncState<Order[]> & Unsubscribe;

const initialSingleOrderState: SingleOrderState = {
    data: [],
    error: "",
    status: "idle",
    unsubscribe: null
}

type OrderState = {
    [shopId in string]: SingleOrderState
}

function ensureInitialized(state: any, shopId: string) {
    if (!state.hasOwnProperty(shopId)) {
        state[shopId] = Object.assign({}, initialSingleOrderState);
    }
}

const ordersSlice = createSlice({
    name: "orders",
    initialState: {} as OrderState,
    reducers: {
        orderAdded(state, action: PayloadAction<{shopId: string, order: Order}>) {
            const {order, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.push(order);
        },
        orderUpdated(state, action: PayloadAction<{shopId: string, order: Order}>) {
            const {order, shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.update(d => d.id === order.id, order);
        },
        /**
         * 指定した ID の order を消去する
         * @param state
         * @param action 消去する order の ID
         */
        orderRemoved(state, action: PayloadAction<{shopId: string, orderId: string}>) {
            const {shopId, orderId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].data.remove(d => d.id === orderId);
        },
        orderSucceeded(state, action: PayloadAction<{shopId: string}>) {
            const {shopId} = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].status = 'succeeded';
        },
        /**
         * OrderStateをshopIdのマップとしたため、extraReducerのpendingでloadingに設定することができない(shopIdがとってこれないため)
         * このため、OrderのAsyncThunkではこのReducerを使う
         * @param state
         * @param action
         */
        orderPending(state, action: PayloadAction<{ shopId: string }>) {
            const { shopId } = action.payload;

            ensureInitialized(state, shopId);
            state[shopId].status = 'loading';
        },
        /**
         * pendingと同様の理由で, OrderのAsyncThunkではrejectedを用いる
         * @param state
         * @param action
         */
        orderRejected(state, action: PayloadAction<{ shopId: string, error: SerializedError }>) {
            const {shopId, error} = action.payload;
            
            ensureInitialized(state, shopId);
            state[shopId].status = 'failed';
            state[shopId].error = error.message;
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchOrders.pending, (state, {meta}) => {
                const shopId = meta.arg;

                ensureInitialized(state, shopId);
                state[shopId].status = 'loading';
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                const {shopId, orders} = action.payload;

                ensureInitialized(state, shopId);
                
                state[shopId].status = 'succeeded'
                state[shopId].data = orders.sort((a, b) => a.created_at.toDate().getTime() - b.created_at.toDate().getTime());
            })

        builder.addCase(streamOrder.fulfilled, (state, action) => {
            const {unsubscribe, shopId} = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].status = 'succeeded'
            state[shopId].unsubscribe = unsubscribe;
        });

        // builder.addCase(addOrder.fulfilled, (state, action) => {
        //     const { shopId, order } = action.payload;
        //
        //     ensureInitialized(state, shopId);
        //
        //     // IDが同じ注文のindex
        //     const sameOrderIndex = state[shopId].data.findIndex(e => e.id === order.id);
        //
        //     if (sameOrderIndex === -1) {
        //         state[shopId].data.push(order);
        //     } else {
        //         state[shopId].data[sameOrderIndex] = order;
        //     }
        // })

        builder.addCase(updateOrder.fulfilled, (state, action) => {
           const {order, shopId} = action.payload;
           
            ensureInitialized(state, shopId);
           
           state[shopId].data.update(e => e.id === order.id, order); 
        });

        builder.addCase(deleteOrder.fulfilled, (state, action) => {
            const {order, shopId} = action.payload;
            
            state[shopId].data.remove(e => e.id === order.id);
        })
    },
});

const orderReducer = ordersSlice.reducer;
export default orderReducer;
export const {orderAdded, orderUpdated, orderRemoved, orderSucceeded, orderRejected, orderPending} = ordersSlice.actions;

/**
 * createdが新しい方が先にソートする
 * @param a
 * @param b
 */
function sortByCreated(a: Order, b: Order) {
    return b.created_at.toDate().getTime() - a.created_at.toDate().getTime()
}

/**
 * completedを前に、それ以外を後に、created_at順でソートする
 * @param a
 * @param b
 */
function sortByCompletedThenCreated(a: Order, b: Order) {
    if (a.status !== b.status) {
        if (a.status === "completed") {
            // aを先に
            return -1;
        } else if (b.status === "completed") {
            // bを先に
            return 1;
        }
    }

    return sortByCreated(a, b);
}

export const selectAllOrders = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort(sortByCreated) ?? [];

export const selectAllOrdersByCompleted = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort(sortByCompletedThenCreated) ?? [];

export const selectAllOrdersInverse = (state: RootState, shopId: string) =>
    state.order[shopId]?.data.slice().sort((a, b) => sortByCreated(b, a)) ?? [];

export const selectOrderStatus = (state: RootState, shopId: string) =>
    state.order[shopId]?.status ?? 'idle';

export const selectOrderById = (state: RootState, shopId: string, orderId: string) =>
    state.order[shopId]?.data.find(e => e.id === orderId);

export const selectReceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrders(state, shopId).filter(e => e.status === "received");

export const selectUnreceivedOrder = (state: RootState, shopId: string) =>
    selectAllOrdersByCompleted(state, shopId).filter(e => e.status !== "received");

/**
 * 商品の遅延時間を含め、最大の完成する時刻を返します
 * 注文がない場合, 現在時刻を返します
 */
export const selectMaxCompleteAt = (state: RootState, shopId: string): Date => {
    const orders = selectAllOrders(state, shopId);
    if (orders.length === 0) {
        return new Date();
    }
    const getTrueCompleteAt = (a: Order) => a.complete_at.toDate().addSeconds(a.delay_seconds);
    // 完成時間を昇順でソート
    orders.sort((a, b) => getTrueCompleteAt(b).getTime() - getTrueCompleteAt(a).getTime());
    return getTrueCompleteAt(orders[0]);
}

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