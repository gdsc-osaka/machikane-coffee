import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {CargoOrder, Order, OrderStatuses, RawOrder} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter} from "../../firebase/converters";
import {selectProductById} from "../product/productsSlice";
import {RootState} from "../store";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import {getToday} from "../../util/dateUtils";
import {QueryConstraint} from "@firebase/firestore";

const ordersQuery = (shopId: string, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return  query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), orderBy("created_at", "desc"), ...queryConstraints);
}

export const fetchOrders = createAsyncThunk("orders/fetchOrders",
    async (shopId: string) => {
        const _query = ordersQuery(shopId);
        const snapshot = await getDocs(_query);

        return snapshot.docs.map(doc => doc.data());
    });

/**
 * order をリアルタイム更新する. ユーザー側で使用されることを想定
 */
export const streamOrders = createAsyncThunk('orders/streamOrders',
    (shopId: string, {dispatch, getState}) => {
        const _query = ordersQuery(shopId);
        const unsubscribe = onSnapshot(_query,(snapshot) => {
                const state: RootState = getState() as RootState;

                snapshot.docChanges().forEach((change) => {

                   if (change.type == "added") {
                       const order = change.doc.data();

                       if (state.order.data.findIndex(e => e.id == order.id) == -1) {
                           dispatch(orderAdded(order));
                       }
                   }
                   if (change.type == "modified") {
                       const order = change.doc.data();
                       dispatch(orderUpdated(order));
                   }
                   if (change.type == "removed") {
                       const id = change.doc.id;
                       dispatch(orderRemoved(id));
                   }
                });
            });

        return unsubscribe;
})

export const addOrder = createAsyncThunk<Order | undefined, {shopId: string, rawOrder: RawOrder}, {state: RootState}>("orders/addOrder",
    async ({shopId, rawOrder}, {getState, rejectWithValue}): Promise<Order | undefined> => {
        // TODO: 直列と考えて待ち時間を計算しているので、並列にも対応させる
        // 注文の待ち時間 (秒)
        let waitingSec = 0;
        // 提供状況
        const orderStatuses: OrderStatuses = {};

        for (const productId of Object.keys(rawOrder.product_amount)) {
            const amount = rawOrder.product_amount[productId];
            const product = selectProductById(getState(), productId);

            // Product が登録されているまたはフェッチされているとき
            if (product != null) {
                waitingSec += product.span * amount;
            }

            // 商品とその数のぶんだけ orderStatuses を追加
            for (let i = 0; i < amount; i++) {
                orderStatuses[`${productId}_${i}`] = {
                    barista_id: 0,
                    status: "idle",
                    product_id: productId,
                   received: false,
                   completed: false
                };
            }
        }

        const order: CargoOrder = {
            status: "idle",
            is_student: rawOrder.is_student,
            product_amount: rawOrder.product_amount,
            index: 1,
            created_at: serverTimestamp(),
            complete_at: new Date().addSeconds(waitingSec).toTimestamp(),
            received: false,
            completed: false,
            order_statuses: orderStatuses,
            delay_seconds: 0
        }

        try {
            // TODO: Transaction を使う
            const lastOrderSnapshot = await getDocs(ordersQuery(shopId, limit(1)));

            // 今日この注文以前に注文があった場合、最新の注文の index + 1 を今回の注文の番号にする & 待ち時間を変更する
            if (!lastOrderSnapshot.empty) {
                const lastOrder = lastOrderSnapshot.docs[0].data();

                // 現在時刻よりも lastOrder の complete_at が遅かったら
                if (lastOrder.complete_at.toDate().getTime() - new Date().getTime() > 0) {
                    order.complete_at = lastOrder.complete_at.toDate().addSeconds(waitingSec).toTimestamp();
                }
                order.index = lastOrder.index + 1;
            }

            // ランダムIDで追加
            const addedDoc = await addDoc(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter), order);
            // ドキュメントを取得してStoreに追加
            const addedOrderSnapshot = await getDoc(doc(db, addedDoc.path).withConverter(orderConverter));
            return addedOrderSnapshot.data();
        } catch (e) {
            rejectWithValue(e);
            return undefined;
        }
    });

/**
 * order_statuses の status が全て completed かつ status が idle のとき, ルートの status も completed に設定する
 */
const switchOrderStatus = (newOrder: Order) => {
    const statusKeys = Object.keys(newOrder.order_statuses);

    if (statusKeys.findIndex(k => newOrder.order_statuses[k].status != "completed") == -1 && newOrder.status == "idle") {
        // order_statuses の status が全て completed のとき
        newOrder.status = "completed";
    }
}

/**
 * 注文を更新する. UIで操作された部分のみ更新すれば, その更新に依存するそれ以外の部分も自動で書き換えられる (completed 等)
 */
export const updateOrder = createAsyncThunk<Order, {shopId: string, newOrder: Order}, {}>('orders/updateOrder',
    async ({shopId, newOrder}) => {
        switchOrderStatus(newOrder);

        const docRef = doc(db, `shops/${shopId}/orders/${newOrder.id}`);
        await updateDoc(docRef.withConverter(orderConverter), newOrder);
        return newOrder;
    });

export const deleteOrder = createAsyncThunk<Order, {shopId: string, order: Order}, {}>('orders/deleteOrder',
    async ({shopId, order}) => {
        const docRef = doc(db, `shops/${shopId}/orders/${order.id}`);
        await deleteDoc(docRef);
        return order;
    })

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
            state.data.push(action.payload);
        },
        orderUpdated(state, action: PayloadAction<Order>) {
            const order = action.payload;
            state.data.update(e => e.id == order.id, order);
        },
        /**
         * 指定した ID の order を消去する
         * @param state
         * @param action 消去する order の ID
         */
        orderRemoved(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.data.remove(e => e.id == id);
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
                state.error = msg == undefined ? null : msg;
            })

        builder.addCase(streamOrders.fulfilled, (state, action) => {
            state.unsubscribe = action.payload;
        });

        builder.addCase(addOrder.fulfilled, (state, action) => {
            const order = action.payload;
            // 重複するデータが存在しないとき
            if (order != undefined && state.data.findIndex(e => e.id == order.id) == -1) {
                state.data.push(order);
            }
        })

        builder.addCase(updateOrder.fulfilled, (state, action) => {
           const newOrder = action.payload;
           state.data.update(e => e.id == newOrder.id, newOrder);
        });

        builder.addCase(deleteOrder.fulfilled, (state, action) => {
            state.data.remove(e => e.id == action.payload.id);
        })
    },
});

const orderReducer = ordersSlice.reducer;
export default orderReducer;
export const {orderAdded, orderUpdated, orderRemoved} = ordersSlice.actions;
export const selectAllOrders = (state: RootState) => state.order.data.slice().sort((a, b) => b.created_at.toDate().getTime() - a.created_at.toDate().getTime());
export const selectOrderStatus = (state: RootState) => state.order.status;
export const selectOrderById = (state: RootState, id: string) => state.order.data.find(e => e.id == id);
export const selectReceivedOrder = (state: RootState) => selectAllOrders(state).filter(e => e.status == "received");
export const selectUnreceivedOrder = (state: RootState) => selectAllOrders(state).filter(e => e.status != "received");
/**
 * 商品の遅延時間を含め、最大の完成する時刻を返します
 * 注文がない場合, 現在時刻を返します
 */
export const selectMaxCompleteAt = (state: RootState): Date => {
    const orders = selectAllOrders(state);
    if (orders.length == 0) {
        return new Date();
    }
    const getTrueCompleteAt = (a: Order) => a.complete_at.toDate().addSeconds(a.delay_seconds);
    // 完成時間を昇順でソート
    orders.sort((a, b) => getTrueCompleteAt(a).getTime() - getTrueCompleteAt(b).getTime());
    return getTrueCompleteAt(orders[0]);
}
/**
 * streamOrdersのunsubscribeを取得
 */
export const selectOrderUnsubscribe = (state: RootState) => state.order.unsubscribe;