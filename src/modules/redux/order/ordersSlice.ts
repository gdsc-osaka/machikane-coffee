import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {Order} from "./orderTypes";
import {RootState} from "../store";
import {addOrder, deleteOrder, fetchOrders, streamOrder, streamOrders, updateOrder} from "./ordersThunk";

const ordersSlice = createSlice({
    name: "orders",
    initialState: {
        data: [],
        status: 'idle',
        error: null,
        // リアルタイムリッスンの Stream を unsubscribe する
        unsubscribe: null,
    } as AsyncState<Order[]> & Unsubscribe,
    reducers: {
        orderAdded(state, action: PayloadAction<Order>) {
            const payload = action.payload;
            // 同じIDのOrderが存在しなければ
            if (state.data.findIndex(e => e.id === payload.id) === -1) {
                state.data.push(action.payload);
            }
        },
        orderUpdated(state, action: PayloadAction<Order>) {
            const order = action.payload;
            state.data.update(e => e.id === order.id, order);
        },
        /**
         * 指定した ID の order を消去する
         * @param state
         * @param action 消去する order の ID
         */
        orderRemoved(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.data.remove(e => e.id === id);
        },
    },
    extraReducers: builder => {
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload.sort((a, b) => a.created_at.toDate().getTime() - b.created_at.toDate().getTime());
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg === undefined ? null : msg;
            })

        builder.addCase(streamOrders.fulfilled, (state, action) => {
            state.unsubscribe = action.payload;
        });

        builder
            .addCase(streamOrder.fulfilled, (state, action) => {
                state.unsubscribe = action.payload.unsubscribe;
            })
            .addCase(streamOrder.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message ?? '';
            });

        builder.addCase(addOrder.fulfilled, (state, action) => {
            const order = action.payload;
            // 重複するデータが存在しないとき
            if (order !== undefined && state.data.findIndex(e => e.id === order.id) === -1) {
                state.data.push(order);
            }
        })

        builder.addCase(updateOrder.fulfilled, (state, action) => {
           const newOrder = action.payload;
           state.data.update(e => e.id === newOrder.id, newOrder);
        });

        builder.addCase(deleteOrder.fulfilled, (state, action) => {
            state.data.remove(e => e.id === action.payload.id);
        })
    },
});

const orderReducer = ordersSlice.reducer;
export default orderReducer;
export const {orderAdded, orderUpdated, orderRemoved} = ordersSlice.actions;

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

export const selectAllOrders = (state: RootState) => state.order.data.slice().sort(sortByCreated);
export const selectAllOrdersByCompleted = (state: RootState) => state.order.data.slice().sort(sortByCompletedThenCreated);
export const selectAllOrdersInverse = (state: RootState) => state.order.data.slice().sort((a, b) => sortByCreated(b, a));
export const selectOrderStatus = (state: RootState) => state.order.status;
export const selectOrderById = (state: RootState, id: string) => state.order.data.find(e => e.id === id);
export const selectReceivedOrder = (state: RootState) => selectAllOrders(state).filter(e => e.status === "received");
export const selectUnreceivedOrder = (state: RootState) => selectAllOrdersByCompleted(state).filter(e => e.status !== "received");
/**
 * 商品の遅延時間を含め、最大の完成する時刻を返します
 * 注文がない場合, 現在時刻を返します
 */
export const selectMaxCompleteAt = (state: RootState): Date => {
    const orders = selectAllOrders(state);
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
export const selectOrderUnsubscribe = (state: RootState) => state.order.unsubscribe;
/**
 * 注文番号と一致する注文を返す
 * WARN: 日時の条件が入ってない
  */
export const selectOrderByIndex = (state: RootState, index: number) => state.order.data.find(e => e.index === index);