import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState, Unsubscribe} from "../stateType";
import {PayloadOrder, Order, OrderStatuses, OrderForAdd} from "./types";
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
    where,
    writeBatch
} from "firebase/firestore";
import {getToday} from "../../util/dateUtils";
import {QueryConstraint} from "@firebase/firestore";

const ordersQuery = (shopId: string, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return  query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), orderBy("created_at", "desc"), ...queryConstraints);
}

const orderQuery = (shopId: string, orderIndex: number, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return  query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), where("index", "==", orderIndex), ...queryConstraints);
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
    (shopId: string, {dispatch}) => {
        const _query = ordersQuery(shopId);
        const unsubscribe = onSnapshot(_query,(snapshot) => {
                snapshot.docChanges().forEach((change) => {

                   if (change.type === "added") {
                       const order = change.doc.data();
                       dispatch(orderAdded(order));
                   }
                   if (change.type === "modified") {
                       const order = change.doc.data();
                       dispatch(orderUpdated(order));
                   }
                   if (change.type === "removed") {
                       const id = change.doc.id;
                       dispatch(orderRemoved(id));
                   }
                });
            });

        return unsubscribe;
})

export const streamOrder = createAsyncThunk('orders/streamOrder',
    async ({shopId, orderIndex}: {shopId: string, orderIndex: number}, {dispatch, getState, rejectWithValue}) => {
        const _query = orderQuery(shopId, orderIndex);

        try {
            const snapshot = await getDocs(_query);

            if (snapshot.empty) {
                return rejectWithValue(`Order not found.`);
            }

            const doc = snapshot.docs[0];

            const unsubscribe = onSnapshot(doc.ref,(doc) => {
                const state = getState() as RootState;
                const data = doc.data();

                if (data === undefined) return;

                // 同じIDのOrderがないとき
                if (state.order.data.findIndex(e => e.id === data.id) === -1) {
                    dispatch(orderAdded(data));
                } else {
                    dispatch(orderUpdated(data));
                }
            });

            return {unsubscribe: unsubscribe, order: doc.data()};

        } catch (e) {
            console.error(e);
            return rejectWithValue(e);
        }
    })

export const addOrder = createAsyncThunk<Order | undefined, {shopId: string, orderForAdd: OrderForAdd}, {state: RootState}>("orders/addOrder",
    async ({shopId, orderForAdd}, {getState, rejectWithValue}): Promise<Order | undefined> => {
        // TODO: 直列と考えて待ち時間を計算しているので、並列にも対応させる
        // 注文の待ち時間 (秒)
        let waitingSec = 0;
        // 提供状況
        const orderStatuses: OrderStatuses = {};

        for (const productId of Object.keys(orderForAdd.product_amount)) {
            const amount = orderForAdd.product_amount[productId];
            const product = selectProductById(getState(), productId);

            // Product が登録されているまたはフェッチされているとき
            if (product !== null) {
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

        const order: PayloadOrder = {
            status: "idle",
            is_student: orderForAdd.is_student,
            product_amount: orderForAdd.product_amount,
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

    if (statusKeys.findIndex(k => newOrder.order_statuses[k].status !== "completed") === -1 && newOrder.status === "idle") {
        // order_statuses の status が全て completed のとき
        newOrder.status = "completed";
    }
}

/**
 * 注文を更新する. UIで操作された部分のみ更新すれば, その更新に依存するそれ以外の部分も自動で書き換えられる (completed 等)
 */
export const updateOrder = createAsyncThunk<Order, {shopId: string, newOrder: Order}, {state: RootState}>('orders/updateOrder',
    async ({shopId, newOrder}, {getState}) => {
        switchOrderStatus(newOrder);
        const batch = writeBatch(db);

        const docRef = doc(db, `shops/${shopId}/orders/${newOrder.id}`);
        batch.update(docRef.withConverter(orderConverter), newOrder);

        // 完成時
        if (newOrder.status === "completed") {
            // 実際の制作時間との差分
            const productionTimeDiff = new Date().getTime() - newOrder.complete_at.toDate().getTime();
            console.log(`actual sec: ${productionTimeDiff / 1000}`);

            // state.orders が常に最新であるという前提. 最新でないなら足りない部分だけクエリして読み取る
            const state = getState();
            const createdAtTime = newOrder.created_at.toDate().getTime();
            // newOrder より後に追加された注文
            const afterOrders = state.order.data
                .filter(order => order.created_at.toDate().getTime() - createdAtTime);


            for (const order of afterOrders) {
                const ref = doc(db, `shops/${shopId}/orders/${order.id}`);
                const correctCompleteAtTime = order.complete_at.toDate().getTime() + productionTimeDiff;
                // FIXME: フィールド名を定数で扱っている
                batch.update(ref, {"complete_at": Timestamp.fromMillis(correctCompleteAtTime)})
            }
        }

        await batch.commit();
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