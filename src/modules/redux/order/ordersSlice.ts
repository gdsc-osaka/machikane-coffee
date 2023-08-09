import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {CargoOrder, Order, OrderStatus, RawOrder} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter} from "../../firebase/converters";
import {selectProductById} from "../product/productsSlice";
import {RootState} from "../store";
import {
    collection,
    doc,
    getDocs,
    query,
    orderBy,
    where,
    onSnapshot,
    limit,
    addDoc,
    getDoc,
    updateDoc,
    Timestamp,
    serverTimestamp
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
 * Order をリアルタイム更新する. ユーザー側で使用されることを想定
 */
export const streamOrders = createAsyncThunk('orders/streamOrders',
    (shopId: string, {dispatch}) => {
        const _query = ordersQuery(shopId);
        const unsubscribe = onSnapshot(_query,(snapshot) => {
                snapshot.docChanges().forEach((change) => {

                   if (change.type == "added") {
                       const order = change.doc.data();
                       dispatch(orderAdded(order));
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
        const orderStatuses: OrderStatus[] = [];
        console.log(rawOrder);

        for (const productId of Object.keys(rawOrder.product_amount)) {
            const amount = rawOrder.product_amount[productId];
            const product = selectProductById(getState(), productId);

            console.log(productId);
            // Product が登録されているまたはフェッチされているとき
            if (product != null) {
                console.log(product.span);
                waitingSec += product.span * amount;
            }

            // 商品とその数のぶんだけ orderStatuses を追加
            for (let i = 0; i < amount; i++) {
                orderStatuses.push({
                   product_id: productId,
                   received: false,
                   completed: false,
                });
            }
        }

        const completeAt = new Date().addSeconds(waitingSec).toTimestamp();

        const order: CargoOrder = {
            is_student: rawOrder.is_student,
            product_amount: rawOrder.product_amount,
            index: 1,
            created_at: serverTimestamp(),
            complete_at: completeAt,
            received: false,
            completed: false,
            order_statuses: orderStatuses
        }

        try {
            // TODO: Transaction を使う
            const lastOrderSnapshot = await getDocs(ordersQuery(shopId, limit(1)));

            // 今日この注文以前に注文があった場合、最新の注文の index + 1 を今回の注文の番号にする
            if (!lastOrderSnapshot.empty) {
                const lastOrder = lastOrderSnapshot.docs[0].data();
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
 * 注文を更新する. UIで操作された部分のみ更新すれば, その更新に依存するそれ以外の部分も自動で書き換えられる (completed 等)
 */
export const updateOrder = createAsyncThunk('orders/updateOrder',
    async ({shopId, newOrder}: {shopId: string, newOrder: Order}) => {
        // const shopRef = db.collection("shops").doc(shopId);
        // const orderRef = shopRef.collection('orders').doc(newOrder.id);

        // OrderStatus: 親オーダーが true なら 子オーダー全て true, 子オーダー全て true なら親オーダーも true
        if (newOrder.completed) {
            newOrder.order_statuses.forEach(e => e.completed = true);
        } else if (newOrder.order_statuses.findIndex(e => !e.completed) == -1) {
            // order_statuses が全て completed のとき
            newOrder.completed = true;
        }

        if (newOrder.received) {
            newOrder.order_statuses.forEach(e => e.received = true);
        } else if (newOrder.order_statuses.findIndex(e => !e.received) == -1) {
            // order_statuses が全て received のとき
            newOrder.received = true;
        }

        const docRef = doc(db, `shops/${shopId}/orders/${newOrder.id}`);
        await updateDoc(docRef.withConverter(orderConverter), newOrder);
        return newOrder;
    });

const ordersSlice = createSlice({
    name: "orders",
    initialState: {
        data: [],
        status: 'idle',
        error: null,
        // リアルタイムリッスンの Stream を unsubscribe する
        unsubscribe: null,
    } as AsyncState<Order[]> & {unsubscribe: (() => void) | null},
    reducers: {
        orderAdded(state, action: PayloadAction<Order>) {
            state.data.push(action.payload);
        },
        orderUpdated(state, action: PayloadAction<Order>) {
            const order = action.payload;
            state.data.update(e => e.id == order.id, order);
        },
        /**
         * 指定した ID の Order を消去する
         * @param state
         * @param action 消去する Order の ID
         */
        orderRemoved(state, action: PayloadAction<string>) {
            const id = action.payload;
            state.data.remove(e => e.id == id);
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.status = 'loading'
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload;
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
            if (order != undefined) {
                state.data.push(order);
            }
        })

        builder.addCase(updateOrder.fulfilled, (state, action) => {
           const newOrder = action.payload;
           state.data.update(e => e.id == newOrder.id, newOrder);
        });
    },
});

const orderReducer = ordersSlice.reducer;
export default orderReducer;
export const {orderAdded, orderUpdated, orderRemoved} = ordersSlice.actions;
export const selectAllOrders = (state: RootState) => state.order.data;
export const selectOrderStatus = (state: RootState) => state.order.status;
export const selectOrderById = (state: RootState, id: string) => state.order.data.find(e => e.id == id);