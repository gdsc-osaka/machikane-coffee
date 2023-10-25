import {createSlice, PayloadAction, SerializedError} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {Order} from "./orderTypes";
import {addOrder, deleteOrder, fetchOrders, streamOrder, updateOrder} from "./ordersThunk";

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

        builder.addCase(addOrder.fulfilled, (state, action) => {
            const { shopId, order } = action.payload;

            ensureInitialized(state, shopId);

            state[shopId].data.push(order);
        })

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