import {QueryConstraint} from "@firebase/firestore";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
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
import {db} from "../../firebase/firebase";
import {orderConverter} from "../../firebase/converters";
import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import {RootState} from "../store";
import {Order, OrderForAdd, OrderStatuses, PayloadOrder} from "./orderTypes";
import {selectProductById} from "../product/productsSlice";
import {orderAdded, orderPending, orderRejected, orderRemoved, orderSucceeded, orderUpdated} from "./ordersSlice";

const ordersQuery = (shopId: string, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), orderBy("created_at", "desc"), ...queryConstraints);
}
const orderQuery = (shopId: string, orderIndex: number, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), where("index", "==", orderIndex), ...queryConstraints);
}

export const fetchOrders = createAsyncThunk<
    { shopId: string, orders: Order[] },
    string,
    {}
>("orders/fetchOrders",
    async (shopId: string, {dispatch}) => {
        dispatch(orderPending({shopId: shopId}));

        const _query = ordersQuery(shopId);
        const snapshot = await getDocs(_query);
        const orders = snapshot.docs.map(doc => doc.data());

        return {orders, shopId}
    });

/**
 * order をリアルタイム更新する. ユーザー側で使用されることを想定
 */
export const streamOrders = (shopId: string, {dispatch}: { dispatch: Dispatch }) => {
    dispatch(orderSucceeded({shopId}))

    const _query = ordersQuery(shopId);
    const unsubscribe = onSnapshot(_query, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.doc.metadata.hasPendingWrites) {
                return;
            }

            if (change.type === "added") {
                const order = change.doc.data();
                dispatch(orderAdded({shopId, order}));
            }
            if (change.type === "modified") {
                const order = change.doc.data();
                dispatch(orderUpdated({shopId, order}));
            }
            if (change.type === "removed") {
                const orderId = change.doc.id;
                dispatch(orderRemoved({shopId, orderId}));
            }
        });
    });

    return unsubscribe;
}

export const streamOrder = createAsyncThunk('orders/streamOrder',
    async ({shopId, orderIndex}: { shopId: string, orderIndex: number }, {dispatch, getState, rejectWithValue}) => {
        dispatch(orderPending({shopId: shopId}))
        const _query = orderQuery(shopId, orderIndex);

        try {
            const snapshot = await getDocs(_query);

            if (snapshot.empty) {
                return rejectWithValue(`Order not found.`);
            }

            const doc = snapshot.docs[0];

            const unsubscribe = onSnapshot(doc.ref, (doc) => {
                const state = getState() as RootState;
                const order = doc.data();

                if (order === undefined) return;

                // 同じIDのOrderがないとき
                if (state.order[shopId].data.findIndex(e => e.id === order.id) === -1) {
                    dispatch(orderAdded({shopId, order}));
                } else {
                    dispatch(orderUpdated({shopId, order}));
                }
            });

            return {unsubscribe: unsubscribe, shopId: shopId, order: doc.data()};

        } catch (e) {
            if (e instanceof Error) {
                dispatch(orderRejected({shopId: shopId, error: e}))
            }
            return rejectWithValue(e);
        }
    })

export const addOrder = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, orderForAdd: OrderForAdd },
    { state: RootState }
>("orders/addOrder", async ({shopId, orderForAdd}, {getState, rejectWithValue, dispatch}) => {
    // TODO: 直列と考えて待ち時間を計算しているので、並列にも対応させる
    // 注文の待ち時間 (秒)
    let waitingSec = 0;
    // 提供状況
    const orderStatuses: OrderStatuses<Timestamp> = {};

    for (const productId of Object.keys(orderForAdd.product_amount)) {
        const amount = orderForAdd.product_amount[productId];
        const product = selectProductById(getState(), shopId, productId);

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
                start_working_at: Timestamp.now(),
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
        order_statuses: orderStatuses,
        delay_seconds: 0,
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

        const addedOrder: Order = {
            ...order,
            id: addedDoc.id,
            created_at: Timestamp.now(),
            order_statuses: orderStatuses
        }

        return {shopId: shopId, order: addedOrder}
    } catch (error) {
        return rejectWithValue(error);
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
export const updateOrder = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, newOrder: Order },
    { state: RootState }
>('orders/updateOrder',
    async ({shopId, newOrder}, {getState, rejectWithValue}) => {
        switchOrderStatus(newOrder);
        const batch = writeBatch(db);

        const docRef = doc(db, `shops/${shopId}/orders/${newOrder.id}`);
        batch.update(docRef.withConverter(orderConverter), newOrder);

        // 完成時
        if (newOrder.status === "completed") {
            // 実際の制作時間との差分
            const productionTimeDiff = new Date().getTime() - newOrder.complete_at.toDate().getTime();

            // state.orders が常に最新であるという前提. 最新でないなら足りない部分だけクエリして読み取る
            const state = getState();
            const createdAtTime = newOrder.created_at.toDate().getTime();
            // newOrder より後に追加された注文
            const afterOrders = state.order[shopId].data
                .filter(order => order.created_at.toDate().getTime() - createdAtTime);


            for (const order of afterOrders) {
                const ref = doc(db, `shops/${shopId}/orders/${order.id}`);
                const correctCompleteAtTime = order.complete_at.toDate().getTime() + productionTimeDiff;
                // FIXME: フィールド名を定数で扱っている
                batch.update(ref, {"complete_at": Timestamp.fromMillis(correctCompleteAtTime)})
            }
        }

        try {
            await batch.commit();
            return {shopId: shopId, order: newOrder};
        } catch (error) {
            return rejectWithValue(error);
        }

    });
export const deleteOrder = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, order: Order },
    {}
>('orders/deleteOrder',
    async ({shopId, order}) => {
        const docRef = doc(db, `shops/${shopId}/orders/${order.id}`);
        await deleteDoc(docRef);
        return {shopId, order};
    })