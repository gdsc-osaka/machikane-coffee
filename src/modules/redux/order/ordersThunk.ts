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
import {Order, OrderForAdd, PayloadOrder} from "./orderTypes";
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
export const streamOrders = (shopId: string, {dispatch}: { dispatch: Dispatch }, ...queryConstraints: QueryConstraint[]) => {
    dispatch(orderSucceeded({shopId}))

    const _query = ordersQuery(shopId, ...queryConstraints);
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
    {}
>("orders/addOrder", async ({shopId, orderForAdd}, {rejectWithValue}) => {
    const order: PayloadOrder = {
        status: "idle",
        is_student: orderForAdd.is_student,
        product_amount: orderForAdd.product_amount,
        index: 1,
        created_at: serverTimestamp(),
        delay_seconds: 0,
    }

    try {
        // TODO: Transaction を使う
        const lastOrderSnapshot = await getDocs(ordersQuery(shopId, limit(1)));

        // 今日この注文以前に注文があった場合、最新の注文の index + 1 を今回の注文の番号にする & 待ち時間を変更する
        if (!lastOrderSnapshot.empty) {
            const lastOrder = lastOrderSnapshot.docs[0].data();

            order.index = lastOrder.index + 1;
        }

        // ランダムIDで追加
        const addedDoc = await addDoc(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter), order);

        const addedOrder: Order = {
            ...order,
            id: addedDoc.id,
            created_at: Timestamp.now(),
        }

        return {shopId: shopId, order: addedOrder}
    } catch (error) {
        return rejectWithValue(error);
    }
});

/**
 * 注文を更新する. UIで操作された部分のみ更新すれば, その更新に依存するそれ以外の部分も自動で書き換えられる (completed 等)
 */
export const updateOrder = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, newOrder: Order },
    {}
>('orders/updateOrder',
    async ({shopId, newOrder}, {rejectWithValue}) => {
        const batch = writeBatch(db);

        const docRef = doc(db, `shops/${shopId}/orders/${newOrder.id}`);
        batch.update(docRef.withConverter(orderConverter), newOrder);

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