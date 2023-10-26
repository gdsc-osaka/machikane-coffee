import {QueryConstraint} from "@firebase/firestore";
import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
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
import {orderConverter, stockConverter} from "../../firebase/converters";
import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import lodash from 'lodash';
import {RootState} from "../store";
import {Order, OrderForAdd, OrderForUpdate, PayloadOrder} from "./orderTypes";
import {
    orderAdded,
    orderIdle,
    orderPending,
    orderRejected,
    orderRemoved,
    orderSucceeded,
    orderUpdated
} from "./ordersSlice";
import {PayloadStock, StockForUpdate} from "../stock/stockTypes";
import {selectAllOrders} from "./orderSelectors";
import {selectAllStocks} from "../stock/stockSelectors";
import {productRef} from "../product/productsThunk";
import {ProductForUpdate} from "../product/productTypes";
import {stockRef} from "../stock/stocksThunk";
import {isOrderAllReceived} from "./orderUtils";

const { v4: uuidv4 } = require('uuid');

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

const orderRef = (shopId: string, orderId: string) => doc(db, `shops/${shopId}/orders/${orderId}`)

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

    return () => {
        dispatch(orderIdle({shopId}))
        unsubscribe();
    };
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
>("orders/addOrder", async ({shopId, orderForAdd}, {getState, rejectWithValue}) => {
    const payloadOrder: PayloadOrder = {
        product_status: {},
        required_product_amount: {},
        stocksRef: [],
        status: "idle",
        product_amount: orderForAdd.product_amount,
        index: 1,
        created_at: serverTimestamp(),
        delay_seconds: 0
    }

    const unreceivedOrders = selectAllOrders(getState(), shopId).filter(o => o.status !== "received");
    const productIds: String[] = [];

    for (const productId in payloadOrder.product_amount) {
        // 商品一つ一つでproduct_statusを設定
        const amount = payloadOrder.product_amount[productId];
        for (let i = 0; i < amount; i++) {
            payloadOrder.product_status[`${productId}_${i+1}`] = {
                productId: productId,
                status: "idle"
            }
        }
        // required_product_amount の初期値=この注文の商品数を設定
        payloadOrder.required_product_amount[productId] = amount;
        productIds.push(productId);
    }

    // required_product_amountに以前の注文の商品数も加算
    for (const o of unreceivedOrders) {
        for (const productId of productIds) {
            const pid = productId as string;

            if (o.product_amount.hasOwnProperty(pid)) {
                payloadOrder.required_product_amount[pid] += o.product_amount[pid];
            }
        }
    }


    try {
        // TODO: Transaction を使う
        const lastOrderSnapshot = await getDocs(ordersQuery(shopId, limit(1)));

        // 今日この注文以前に注文があった場合、最新の注文の index + 1 を今回の注文の番号にする & 待ち時間を変更する
        if (!lastOrderSnapshot.empty) {
            const lastOrder = lastOrderSnapshot.docs[0].data();

            payloadOrder.index = lastOrder.index + 1;
        }

        const batch = writeBatch(db);

        const orderId = uuidv4();
        const orderRef = doc(db, `shops/${shopId}/orders/${orderId}`);

        for (const prodKey in payloadOrder.product_amount) {
            const amount = payloadOrder.product_amount[prodKey];
            for (let i = 0; i < amount; i++) {
                const stock: PayloadStock = {
                    orderRef: orderRef,
                    barista_id: 0,
                    created_at: serverTimestamp(),
                    product_id: prodKey,
                    start_working_at: serverTimestamp(),
                    status: "idle",
                    spend_to_make: 0
                };
                const stockId = crypto.randomUUID();
                const stockRef = doc(db, `shops/${shopId}/stocks/${stockId}`);

                payloadOrder.stocksRef.push(stockRef);

                batch.set(stockRef.withConverter(stockConverter), stock);
            }
        }

        batch.set(orderRef.withConverter(orderConverter), payloadOrder);

        try {
            await batch.commit();
            const order: Order = {
                ...payloadOrder,
                id: orderId,
                created_at: Timestamp.now()
            }
            return {shopId, order}

        } catch (e) {
            return rejectWithValue(e);
        }

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

export const receiveOrderIndividual = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, order: Order, productStatusKey: string },
    { state: RootState }
>('orders/receiveOrderIndividual', async ({shopId, order, productStatusKey}, {getState, rejectWithValue}) => {
    const state = getState();
    const latestStocks = selectAllStocks(state, shopId);
    const latestOrders = selectAllOrders(state, shopId);
    const prodId = order.product_status[productStatusKey].productId;
    const newerOrders = latestOrders /* このOrder以降のrequired_product_amountを更新すべきOrder */
        .filter(o => o.created_at.seconds > order.created_at.seconds && Object.keys(o.product_amount).includes(prodId));

    const batch = writeBatch(db);

    // Update This Order
    const newOrder = lodash.cloneDeep(order);
    const allReceived = isOrderAllReceived(newOrder);
    const orderStatus = allReceived ? 'received' : 'idle';

    newOrder.product_status[productStatusKey].status = 'received';
    newOrder.required_product_amount[prodId] -= 1; // 商品の必要数を1減らす
    newOrder.status = orderStatus;

    batch.update(orderRef(shopId, newOrder.id), {
        product_status: newOrder.product_status,
        required_product_amount: {
            ...newOrder.required_product_amount,
            [prodId]: increment(-1)
        },
        status: orderStatus
    } as OrderForUpdate)

    // Update Products
    batch.update(productRef(shopId, prodId), {
        stock: increment(-1)
    } as ProductForUpdate)

    // Update Other Orders
    for (const newerOrder of newerOrders) {
        batch.update(orderRef(shopId, newerOrder.id), {
            required_product_amount: {
                [prodId]: increment(-1),
            }
        } as OrderForUpdate)
    }

    // Update Stocks
    const stock = latestStocks /* 関係づけられているStockでproduct_idが一致するもの */
        .find(s => s.orderRef.id === order.id && s.product_id === prodId)

    if (stock === undefined) {
        return rejectWithValue('注文データに関連付けられた在庫データが存在しません')
    }

    const stRef = stockRef(shopId, stock.id);

    if (stock.status === 'completed') {
        batch.update(stRef, {
            status: 'received'
        } as StockForUpdate)

    } else {
        /* 関連付けられているStockがcompletedでない場合 */

        // latestStocksが日付降順であること前提
        const altStock = latestStocks.find(s => s.status === 'completed' && s.product_id === prodId); /* 代わりとなる在庫 */

        if (altStock) {
            const altStockRef = stockRef(shopId, altStock.id);
            const altStockOrderRef = altStock.orderRef;

            // StockをUpdate
            batch.update(altStockRef, {
                status: 'received',
                orderRef: orderRef(shopId, order.id)
            } as StockForUpdate)

            batch.update(stRef, {
                orderRef: altStockOrderRef
            } as StockForUpdate)

            // Order.stocksRefを交換
            batch.update(altStockOrderRef, {
                stocksRef: arrayRemove(altStockRef)
            } as OrderForUpdate)

            batch.update(altStockOrderRef, {
                stocksRef: arrayUnion(stRef)
            } as OrderForUpdate)
        } else {
            return rejectWithValue(`完成済みの在庫が見つかりませんでした (product_id: ${prodId})`)
        }
    }

    try {
        await batch.commit();
        return {shopId, order: newOrder}

    } catch (e) {
        return rejectWithValue(e);
    }
})