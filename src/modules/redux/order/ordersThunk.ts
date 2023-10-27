import {QueryConstraint} from "@firebase/firestore";
import {
    arrayRemove,
    arrayUnion,
    collection,
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
    WriteBatch,
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
import {PayloadStock, Stock, StockForUpdate} from "../stock/stockTypes";
import {selectAllOrders} from "./orderSelectors";
import {selectAllStocks} from "../stock/stockSelectors";
import {productRef} from "../product/productsThunk";
import {ProductForUpdate} from "../product/productTypes";
import {stockRef} from "../stock/stocksThunk";
import {isOrderAllReceived} from "./orderUtils";

const { v4: uuidv4 } = require('uuid');

const ordersRef = (shopId: string) => {
    const today = Timestamp.fromDate(getToday());
    return query(collection(db, `shops/${shopId}/orders`),
        where("created_at", ">=", today), orderBy("created_at", "desc"));
}

const ordersQuery = (shopId: string, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today), orderBy("created_at", "desc"), ...queryConstraints);
}
const orderQueryByIndex = (shopId: string, orderIndex: number, ...queryConstraints: QueryConstraint[]) => {
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

export const fetchOrderByIndex = createAsyncThunk<
    { shopId: stinrg, order: Order },
    { shopId: string, orderIndex: number },
    {  }
>("orders/fetchOrderByIndex",
    async ({shopId, orderIndex}, {}) => {
    const order = await getDocs(orderQueryByIndex(shopId, orderIndex))

});

/**
 * order をリアルタイム更新する. ユーザー側で使用されることを想定
 */
export const streamOrders = (shopId: string, {dispatch}: { dispatch: Dispatch }, ...queryConstraints: QueryConstraint[]) => {
    dispatch(orderSucceeded({shopId}))

    const unsubscribe = onSnapshot(ordersRef(shopId), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                if (change.doc.metadata.hasPendingWrites) {
                    return;
                }
                const order = orderConverter.fromFirestore(change.doc);
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

export const streamOrder = async (shopId: string, orderIndex: number, {dispatch}: { dispatch: Dispatch }) => {
    dispatch(orderPending({shopId: shopId}))
    const _query = orderQueryByIndex(shopId, orderIndex);

    try {
        const snapshot = await getDocs(_query);

        if (snapshot.empty) {
            return Promise.reject(`Order not found.`);
        }

        const doc = snapshot.docs[0];

        const unsubscribe = onSnapshot(doc.ref.withConverter(orderConverter), (doc) => {
            const order = doc.data();

            if (order) {
                dispatch(orderUpdated({shopId, order}));
            }
        });

        return () => {
            dispatch(orderIdle({shopId}));
            unsubscribe();
        };

    } catch (e) {
        if (e instanceof Error) {
            dispatch(orderRejected({shopId: shopId, error: e}))
            return Promise.reject(e);
        }
    }
}

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
    { state: RootState }
>('orders/deleteOrder',
    async ({shopId, order}, {getState, rejectWithValue}) => {
        const docRef = doc(db, `shops/${shopId}/orders/${order.id}`);

        const latestStocks = selectAllStocks(getState(), shopId);

        const batch = writeBatch(db);

        for (const stockRef of order.stocksRef) {
            batch.delete(stockRef);

            const stock = latestStocks.find(s => s.id === stockRef.id);

            if (stock && stock.status === "completed") {
                batch.update(productRef(shopId, stock.product_id), {
                    stock: increment(-1)
                } as ProductForUpdate)
            }
        }
        batch.delete(docRef);

        try {
            await batch.commit();
            return {shopId, order};
        } catch (e) {
            return rejectWithValue(e)
        }

    })

export const receiveOrder = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, order: Order },
    { state: RootState }
>('orders/receiveOrder', async ({shopId, order}, {getState, rejectWithValue}) => {
    const state = getState();
    const latestStocks = selectAllStocks(state, shopId);
    const latestOrders = selectAllOrders(state, shopId).filter(o => o.created_at.seconds > order.created_at.seconds);

    const batch = writeBatch(db);
    const newOrder = lodash.cloneDeep(order);
    const stockAmountLeft = new Map<string, number>(); /* 必要な在庫数 */

    for (const productStatusKey in order.product_status) {
        const productStatus = order.product_status[productStatusKey];
        if (productStatus.status === 'idle') {
            const prodId = productStatus.productId;
            stockAmountLeft.set(prodId, (stockAmountLeft.get(prodId) ?? 0) + 1)

            const newerOrders = latestOrders /* このOrder以降のrequired_product_amountを更新すべきOrder */
                .filter(o => Object.keys(o.product_amount).includes(prodId));

            receiveIndividualBatch({
                batch, shopId, newOrder,
                productStatusKey, newerOrders
            })
        }
    }

    const productIds = Array.from(stockAmountLeft.keys());
    const relatedStock = latestStocks.filter(s => s.orderRef.id === order.id && productIds.includes(s.product_id));
    const alterStocks = latestStocks.filter(s => s.orderRef.id !== order.id && productIds.includes(s.product_id) && s.status === 'completed');

    for (const st of relatedStock) {
        const prodId = st.product_id;

        if (st.status === 'completed') {
            // 関連付けられたStockが完成の場合
            batch.update(stockRef(shopId, st.id), {
                status: 'received'
            } as StockForUpdate)

        } else {
            // 完成でない場合、他の注文ののStockを完成にする
            const altStock = alterStocks.find(s => s.product_id === prodId);

            if (altStock) {
                alterStocks.remove(s => s.id === altStock.id);
                swapAndReceiveStockBatch(batch, shopId, st, altStock);
            }

        }

        stockAmountLeft.set(prodId, (stockAmountLeft.get(prodId) ?? 0) - 1)
    }

    // 在庫が足りない場合
    if (Array.from(stockAmountLeft.values()).find(v => v > 0) !== undefined) {
        return rejectWithValue('在庫が足りません');
    }

    try {
        await batch.commit();
        return {shopId, order: newOrder}

    } catch (e) {
        return rejectWithValue(e);
    }
})

export const receiveOrderIndividual = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, order: Order, productStatusKey: string },
    { state: RootState }
>('orders/receiveOrderIndividual', async ({shopId, order, productStatusKey}, {getState, rejectWithValue, dispatch}) => {
    const state = getState();
    const latestStocks = selectAllStocks(state, shopId);
    const latestOrders = selectAllOrders(state, shopId);
    const prodId = order.product_status[productStatusKey].productId;
    const newerOrders = latestOrders /* このOrder以降のrequired_product_amountを更新すべきOrder */
        .filter(o => o.created_at.seconds > order.created_at.seconds && Object.keys(o.product_amount).includes(prodId));

    const batch = writeBatch(db);

    const newOrder = lodash.cloneDeep(order);

    receiveIndividualBatch({
        batch, shopId, newOrder,
        productStatusKey, newerOrders
    })

    // Update Stocks
    const stock = latestStocks /* 関係づけられているStockでproduct_idが一致するもの */
        .find(s => s.orderRef.id === newOrder.id && s.product_id === prodId)

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
            swapAndReceiveStockBatch(batch, shopId, stock, altStock);
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

export const unreceiveOrder = createAsyncThunk<
    { shopId: string, order: OrderForUpdate },
    { shopId: string, order: Order },
    { state: RootState }
>('orders/unreceiveOrder', async ({shopId, order}, {getState, rejectWithValue}) => {
    const state = getState();
    const latestOrders = selectAllOrders(state, shopId).filter(o => o.created_at.seconds > order.created_at.seconds);
    const prodIds = Object.keys(order.product_amount);
    const newerOrders = latestOrders /* このOrder以降のrequired_product_amountを更新すべきOrder */
        .filter(o => o.created_at.seconds > order.created_at.seconds &&
            Object.keys(o.product_amount).find(id => prodIds.includes(id)) !== undefined); /* orderのproductIdが一つでも含まれていれば更新対象 */

    const batch = writeBatch(db);

    console.log("Update Order")
    // Update Order
    const orderForUpdate: OrderForUpdate = {
        product_status: {},
        status: 'idle',
        required_product_amount: {},
    };
    for (const pStatusKey in order.product_status) {
        const prodStatus = order.product_status[pStatusKey];

        orderForUpdate.product_status![pStatusKey] = {
            ...prodStatus, status: 'idle'
        }
    }

    console.log("Update Products and orderForUpdate.required_product_amount")
    // Update Products and orderForUpdate.required_product_amount
    for (const prodId in order.product_amount) {
        console.log(prodId)
        const amount = order.product_amount[prodId];
        batch.update(productRef(shopId, prodId), {
            stock: increment(amount)
        } as ProductForUpdate)

        console.log(`__${prodId}`)
        // Update required_product_amount
        try {

            orderForUpdate.required_product_amount![prodId] = increment(amount);
        } catch (e) {
            console.error(e)
        }
        console.log(`____${prodId}`)
    }

    console.log("batch.update")
    batch.update(orderRef(shopId, order.id), orderForUpdate);

    console.log("Update Other Order")
    // Update Other Orders (required_product_amountを増やす)
    for (const newerOrder of newerOrders) {
        let orderDiff = {};

        for (const prodId in order.product_amount) {
            orderDiff = {
                ...orderDiff,
                // ドット記法でprodIdだけ更新する
                [`required_product_amount.${prodId}`]: increment(order.product_amount[prodId])
            } // FIXME ドット記法にも型を対応する
        }

        batch.update(orderRef(shopId, newerOrder.id), orderDiff);
    }

    console.log("Update Stocks")
    // Update Stocks
    for (const stRef of order.stocksRef) {
        batch.update(stRef, {
            status: 'completed'
        } as StockForUpdate)
    }

    try {
        console.log(orderForUpdate);
        await batch.commit();
        return {shopId, order: {...orderForUpdate, id: order.id}};
    } catch (e) {
        console.error(e);
        return rejectWithValue(e);
    }
});

function receiveIndividualBatch(args: {batch: WriteBatch, shopId: string, newOrder: Order, productStatusKey: string, newerOrders: Order[]}) {
    const {batch, shopId, newOrder, productStatusKey, newerOrders} = args;

    const prodId = newOrder.product_status[productStatusKey].productId;

    // Update This Order
    newOrder.product_status[productStatusKey].status = 'received';
    newOrder.required_product_amount[prodId] -= 1; // 商品の必要数を1減らす
    const allReceived = isOrderAllReceived(newOrder);
    const orderStatus = allReceived ? 'received' : 'idle';
    newOrder.status = orderStatus;

    batch.update(orderRef(shopId, newOrder.id), {
        product_status: newOrder.product_status,
        [`required_product_amount.${prodId}`]: increment(-1),
        status: orderStatus
    }) // FIXME ドット記法にも型を対応する

    // Update Products
    batch.update(productRef(shopId, prodId), {
        stock: increment(-1)
    } as ProductForUpdate)

    // Update Other Orders
    for (const newerOrder of newerOrders) {
        batch.update(orderRef(shopId, newerOrder.id), {
            [`required_product_amount.${prodId}`]: increment(-1)
        }) // FIXME ドット記法にも型を対応する
    }
}

/**
 * Orderに紐づけられたstockを入れ替えてreceivedにする
 * @param batch
 * @param shopId
 * @param stock 元のStock
 * @param altStock 入れ替えるStock
 */
function swapAndReceiveStockBatch(batch: WriteBatch, shopId: string, stock: Stock, altStock: Stock) {
    const altStockRef = stockRef(shopId, altStock.id);
    const stRef = stockRef(shopId, stock.id);
    const altStockOrderRef = altStock.orderRef;
    const stOrderRef = stock.orderRef;

    // StockをUpdate
    batch.update(altStockRef, {
        status: 'received',
        orderRef: stock.orderRef
    } as StockForUpdate)

    batch.update(stRef, {
        orderRef: altStockOrderRef
    } as StockForUpdate)

    // Order.stocksRefを交換
    batch.update(stOrderRef, {
        stocksRef: arrayRemove(stRef)
    } as OrderForUpdate)

    batch.update(stOrderRef, {
        stocksRef: arrayUnion(altStockRef)
    } as OrderForUpdate)

    batch.update(altStockOrderRef, {
        stocksRef: arrayRemove(altStockRef)
    } as OrderForUpdate)

    batch.update(altStockOrderRef, {
        stocksRef: arrayUnion(stRef)
    } as OrderForUpdate)
}