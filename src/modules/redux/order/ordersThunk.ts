import {QueryConstraint} from "@firebase/firestore";
import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDocs,
    increment, limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    Timestamp,
    Transaction,
    where,
    writeBatch
} from "firebase/firestore";
import {getToday, isSameDay} from "../../util/dateUtils";
import {db} from "../../firebase/firebase";
import {orderConverter, stockConverter} from "../../firebase/converters";
import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import lodash from 'lodash';
import {RootState} from "../store";
import {Order, OrderForAdd, OrderForUpdate, PayloadOrder} from "./orderTypes";
import {orderAdded, orderIdle, orderPending, orderRemoved, orderSucceeded, orderUpdated} from "./ordersSlice";
import {PayloadStock, Stock, StockForUpdate} from "../stock/stockTypes";
import {selectAllOrders} from "./orderSelectors";
import {selectAllStocks} from "../stock/stockSelectors";
import {productRef} from "../product/productsThunk";
import {ProductForUpdate} from "../product/productTypes";
import {stockRef} from "../stock/stocksThunk";
import {getTimeToMake, isOrderAllReceived, isOrderCompleted} from "../../util/orderUtils";
import {selectAllProducts} from "../product/productsSlice";
import {orderInfoRef} from "../info/infoRef";
import {OrderInfoForAdd, OrderInfoForUpdate} from "../info/infoTypes";
import {selectShopById} from "../shop/shopsSlice";

const { v4: uuidv4 } = require('uuid');

export const ordersQuery = (shopId: string, ...queryConstraints: QueryConstraint[]) => {
    const today = Timestamp.fromDate(getToday());
    return query(
        collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today),
        orderBy("created_at", "desc"),
        limit(24),
        ...queryConstraints
    );
}
const orderQueryByIndex = (shopId: string, orderIndex: number) => {
    const today = Timestamp.fromDate(getToday());
    return query(
        collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
        where("created_at", ">=", today),
        where("index", "==", orderIndex)
    );
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

export const fetchOrderByIndex = async ({shopId, orderIndex}: {shopId: string, orderIndex: number}) => {
    const snapshot = await getDocs(orderQueryByIndex(shopId, orderIndex));

    if (snapshot.empty) return undefined;

    const orders = snapshot.docs.map(d => d.data());
    return orders[0];
};

/**
 * order をリアルタイム更新する. ユーザー側で使用されることを想定
 */
export const streamOrders = (shopId: string, {dispatch}: { dispatch: Dispatch }) => {
    dispatch(orderSucceeded({shopId}));

    const unsubscribe = onSnapshot(ordersQuery(shopId), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                if (change.doc.metadata.hasPendingWrites) {
                    return;
                }
                console.log("added order")
                const order = change.doc.data({ serverTimestamps: 'estimate' });
                dispatch(orderAdded({shopId, order}));
            }
            if (change.type === "modified") {
                const order = change.doc.data({ serverTimestamps: 'estimate' });

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

export const streamOrder = (shopId: string, orderId: string, {dispatch}: { dispatch: Dispatch }) => {
    dispatch(orderSucceeded({shopId: shopId}))

    const unsubscribe = onSnapshot(orderRef(shopId, orderId).withConverter(orderConverter), (doc) => {
        const order = doc.data({ serverTimestamps: 'estimate' });

        if (order) {
            dispatch(orderUpdated({shopId, order}));
        }
    });

    return () => {
        dispatch(orderIdle({shopId}));
        unsubscribe();
    };
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
        delay_seconds: 0,
        complete_at: Timestamp.now(),
        received_at: Timestamp.now()

    }

    const state = getState();
    const allOrders = selectAllOrders(state, shopId);
    const products = selectAllProducts(state, shopId);
    const shop = selectShopById(state, shopId);
    const unreceivedOrders = allOrders.filter(o => o.status !== "received");
    const productIds: String[] = [];
    const timeToMakeSec = getTimeToMake(orderForAdd.product_amount, products, shop ? Object.keys(shop.baristas).length : 1);

    for (const productId in payloadOrder.product_amount) {
        // 商品一つ一つでproduct_statusを設定
        const amount = payloadOrder.product_amount[productId];

        for (let i = 0; i < amount; i++) {
            payloadOrder.product_status[`${productId}_${i+1}`] = {
                product_id: productId,
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
        let orderIndex = 1;
        let orderId = uuidv4();

        // 注文番号は必ず整合性が取れてないといけないため, Transaction を使用する.、
        await runTransaction(db, async (transaction) => {
            // OrderInfoを更新する
            const oInfoRef = orderInfoRef(shopId);
            const snapshot = await transaction.get(oInfoRef);
            const orderInfo = snapshot.data();
            const today = getToday();

            if (snapshot.exists() && orderInfo && isSameDay(orderInfo.reset_at.toDate(), today)) {
                orderIndex = orderInfo.last_order_index + 1;

                transaction.update(oInfoRef, {
                    last_order_index: increment(1)
                } as OrderInfoForUpdate);

            } else {
                transaction.set(oInfoRef, {
                    last_order_index: 1,
                    reset_at: serverTimestamp()
                } as OrderInfoForAdd);
            }

            // idの末尾に注文番号を付加する. BaristaPageで使用 あまり良い方法ではない
            orderId += `_${orderIndex}`

            const lastOrders = allOrders.sort((a, b) => b.created_at.seconds - a.created_at.seconds);
            const lastIdleOrders = lastOrders.filter(o => o.status === 'idle');

            const now = new Date();

            payloadOrder.index = orderIndex;

            if (lastIdleOrders.length !== 0 && lastIdleOrders[0].complete_at.toMillis() > now.getTime()) {
                const lastIdleOrder = lastIdleOrders[0];
                payloadOrder.complete_at = Timestamp.fromMillis(lastIdleOrder.complete_at.toMillis() + timeToMakeSec * 1000);
            } else {
                payloadOrder.complete_at = Timestamp.fromDate(new Date().addSeconds(timeToMakeSec))
            }

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
                        completed_at: serverTimestamp(),
                        status: "idle",
                        spend_to_make: 0
                    };
                    const stockId = crypto.randomUUID();
                    const stockRef = doc(db, `shops/${shopId}/stocks/${stockId}`);

                    payloadOrder.stocksRef.push(stockRef);

                    transaction.set(stockRef.withConverter(stockConverter), stock);
                }
            }

            transaction.set(orderRef.withConverter(orderConverter), payloadOrder);
        })

        const order: Order = {
            ...payloadOrder,
            id: orderId,
            created_at: Timestamp.now(),
            received_at: Timestamp.now()
        }
        return {shopId, order}

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
    const ordersAfterThis = selectAllOrders(state, shopId) /* この注文以降の注文 */
        .filter(o => o.created_at.seconds > order.created_at.seconds);
    const latestProducts = selectAllProducts(state, shopId);

    if (!isOrderCompleted(order, latestProducts, "product_status")) {
        return rejectWithValue('Order is not completed.')
    }

    const stockAmountLeft = Object.assign({}, order.product_amount); /* 残りの必要な在庫数 */
    const orderForUpdate: OrderForUpdate = {};
    for (const productStatusKey in order.product_status) {
        const productStatus = order.product_status[productStatusKey];

        if (productStatus.status === 'received') {
            const prodId = productStatus.product_id;
            stockAmountLeft[prodId] -= 1;

            if (stockAmountLeft[prodId] === 0) {
                delete stockAmountLeft[prodId];
                orderForUpdate[`product_status.${productStatusKey}`] = {
                    product_id: prodId,
                    status: 'received'
                }
            }
        }
    }

    try {
        const oRef = orderRef(shopId, order.id);

        await runTransaction(db, async (transaction) => {
            const latestOrderSnapshot = await transaction.get(oRef.withConverter(orderConverter));
            if (!latestOrderSnapshot.exists()) return Promise.reject('該当する注文が見つかりません');
            const latestOrder = latestOrderSnapshot.data();

            // 注文が受け取り済みなら処理をしない
            if (latestOrder.status === 'received') return Promise.reject('該当する注文は既に受け取り済みです');

            // Update Products + calculate reqProdAmoDiff
            const reqProdAmoDiff: OrderForUpdate = {};
            for (const productId in stockAmountLeft) {
                const amLeft = stockAmountLeft[productId];

                if (amLeft > 0) {
                    const incre = increment(-amLeft);
                    reqProdAmoDiff[`required_product_amount.${productId}`] = incre;
                    try {
                        transaction.update(productRef(shopId, productId), {
                            stock: incre
                        } as ProductForUpdate)
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            // Update This Order
            try {
                transaction.update(orderRef(shopId, order.id), {
                    ...reqProdAmoDiff,
                    ...orderForUpdate,
                    status: "received",
                    received_at: serverTimestamp(),
                } as OrderForUpdate);
            } catch (e) {
                console.error(e);
            }

            // Update Other Orders
            const completeAtDiff = order.complete_at.toMillis() - new Date().getTime();
            for (const orderAfterThis of ordersAfterThis) {
                try {
                    transaction.update(orderRef(shopId, orderAfterThis.id), {
                        ...reqProdAmoDiff,
                        complete_at: Timestamp.fromMillis(orderAfterThis.complete_at.toMillis() - completeAtDiff)
                    } as OrderForUpdate);
                } catch (e) {
                    console.error(e);
                }
            }

            // Update Stocks
            const productIds = Object.keys(stockAmountLeft);
            const relatedStock = latestStocks
                .filter(s => s.orderRef.id === order.id && productIds.includes(s.product_id));
            const alterStocks = latestStocks
                .filter(s => s.orderRef.id !== order.id && productIds.includes(s.product_id)
                    && s.status === 'completed');

            for (const st of relatedStock) {
                const prodId = st.product_id;

                if (st.status === 'completed') {
                    // 関連付けられたStockが完成の場合

                    // Stockが足りてるか確認するため
                    stockAmountLeft[prodId] -= 1;
                    try {
                        transaction.update(stockRef(shopId, st.id), {
                            status: 'received'
                        } as StockForUpdate)
                    } catch (e) {
                        console.error(e);
                    }

                } else {
                    // 完成でない場合、他の注文ののStockを完成にする
                    const altStock = alterStocks.find(s => s.product_id === prodId);

                    if (altStock) {
                        alterStocks.remove(s => s.id === altStock.id);
                        swapAndReceiveStock(transaction, shopId, st, altStock);
                        // Stockが足りてるか確認するため
                        stockAmountLeft[prodId] -= 1;
                    }
                }
            }

            // Stockが足りない場合
            if (Object.values(stockAmountLeft).find(e => e > 0) !== undefined) {
                return rejectWithValue('在庫が足りません');
            }

        });
    } catch (e) {
        console.error(e);
        rejectWithValue(e);
    }
    return {shopId, order: order}
})

export const receiveOrderIndividual = createAsyncThunk<
    { shopId: string, order: Order },
    { shopId: string, order: Order, productStatusKey: string },
    { state: RootState }
>('orders/receiveOrderIndividual', async ({shopId, order, productStatusKey}, {getState, rejectWithValue}) => {
    const state = getState();
    const latestStocks = selectAllStocks(state, shopId);
    const latestOrders = selectAllOrders(state, shopId);
    const products = selectAllProducts(state, shopId);
    const shop = selectShopById(state, shopId);
    const prodId = order.product_status[productStatusKey].product_id;
    const product = products.find(p => p.id === prodId);
    const newerOrders = latestOrders /* このOrder以降のrequired_product_amountを更新すべきOrder */
        .filter(o => o.created_at.seconds > order.created_at.seconds && Object.keys(o.product_amount).includes(prodId));

    try {
        const newOrder = lodash.cloneDeep(order);

        await runTransaction(db, async (transaction) => {
            const oRef = orderRef(shopId, newOrder.id);
            const latestOrderSnapshot = await transaction.get(oRef.withConverter(orderConverter));
            if (!latestOrderSnapshot.exists()) return Promise.reject('該当する注文がありません');
            const latestOrder = latestOrderSnapshot.data();

            /// 受け取り済みなら処理をやめる
            if (latestOrder.product_status[productStatusKey].status === 'received') return Promise.reject('該当する商品は既に受け取り済みです');

            // region Update Products
            transaction.update(productRef(shopId, prodId), {
                stock: increment(-1)
            } as ProductForUpdate)
            // endregion

            // region Update Stocks
            const stock = latestStocks /* 関係づけられているStockでproduct_idが一致するもの */
                .find(s => s.orderRef.id === newOrder.id && s.product_id === prodId);

            if (stock === undefined) {
                return rejectWithValue('注文データに関連付けられた在庫データが存在しません')
            }

            const stRef = stockRef(shopId, stock.id);
            let timeSpentToMakeMills: number;

            if (stock.status === 'completed') {
                transaction.update(stRef, {
                    status: 'received'
                } as StockForUpdate)

                timeSpentToMakeMills = stock.completed_at.seconds - stock.start_working_at.seconds;

            } else {
                /* 関連付けられているStockがcompletedでない場合 */

                // latestStocksが日付降順であること前提
                const altStock = latestStocks.find(s => s.status === 'completed' && s.product_id === prodId); /* 代わりとなる在庫 */

                if (altStock) {
                    swapAndReceiveStock(transaction, shopId, stock, altStock);
                    timeSpentToMakeMills = altStock.completed_at.toMillis() - altStock.start_working_at.toMillis();

                } else {
                    return rejectWithValue(`完成済みの在庫が見つかりませんでした (product_id: ${prodId})`)
                }
            }
            // endregion

            // region Update This Order
            newOrder.product_status[productStatusKey].status = 'received';
            newOrder.required_product_amount[prodId] -= 1; // 商品の必要数を1減らす
            const allReceived = isOrderAllReceived(newOrder);
            const orderStatus = allReceived ? 'received' : 'idle';
            newOrder.status = orderStatus;

            const baristaCount = shop ? Object.keys(shop.baristas).length : 1
            const newCompleteAtDiff = (product?.span ?? 0) * 1000 / baristaCount - timeSpentToMakeMills;

            transaction.update(oRef, {
                product_status: newOrder.product_status,
                [`required_product_amount.${prodId}`]: increment(-1),
                status: orderStatus,
                complete_at: Timestamp.fromMillis(order.complete_at.toMillis() - newCompleteAtDiff),
                received_at: allReceived ? serverTimestamp() : order.received_at
            }) // FIXME OrderForUpdateを使う
            // endregion

            // region Update Other Orders
            for (const newerOrder of newerOrders) {
                transaction.update(orderRef(shopId, newerOrder.id), {
                    [`required_product_amount.${prodId}`]: increment(-1),
                    complete_at: Timestamp.fromMillis(newerOrder.complete_at.toMillis() - timeSpentToMakeMills),
                }); // FIXME OrderForUpdateを使う
            }
            // endregion
        });
        return {shopId, order: newOrder};

    } catch (e) {
        console.error(e);
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

    // Orderの差分を作成
    const orderForUpdate: OrderForUpdate = {
        status: 'idle',
        product_status: {}
    };

    for (const pStatusKey in order.product_status) {
        const prodStatus = order.product_status[pStatusKey];

        orderForUpdate.product_status![pStatusKey] = {
            ...prodStatus, status: 'idle'
        }
    }

    // Update Products & required_product_amount の差分を作成
    const reqProdAmDiff: OrderForUpdate = {}; /* order と newerOrder で使う required_product_amount の差分 */

    try {
        const oRef = orderRef(shopId, order.id);

        await runTransaction(db, async (transaction) => {
            const latestOrderSnapshot = await transaction.get(oRef.withConverter(orderConverter));
            if (!latestOrderSnapshot.exists()) return;
            const latestOrder = latestOrderSnapshot.data();

            /// 既に未受け取りになっていたら処理をやめる
            if (latestOrder.status === 'idle') return;

            for (const prodId in order.product_amount) {
                const amount = order.product_amount[prodId];

                transaction.update(productRef(shopId, prodId), {
                    stock: increment(amount)
                } as ProductForUpdate)

                reqProdAmDiff[`required_product_amount.${prodId}`] = increment(amount);
            }

            // Update Order
            transaction.update(orderRef(shopId, order.id), {
                ...orderForUpdate,
                ...reqProdAmDiff
            });

            // Update Other Orders (required_product_amountを増やす)
            for (const newerOrder of newerOrders) {
                transaction.update(orderRef(shopId, newerOrder.id), {
                    ...reqProdAmDiff
                });
            }

            // Update Stocks
            for (const stRef of order.stocksRef) {
                try {
                    transaction.update(doc(db, stRef.path), {
                        status: 'completed'
                    } as StockForUpdate)
                } catch (e) {
                    console.error(e);
                }
            }
        });

        return {shopId, order: {...orderForUpdate, id: order.id}};

    } catch (e) {
        console.error(e);
        return rejectWithValue(e);
    }
});

/**
 * Orderに紐づけられたstockを入れ替えてreceivedにする
 * @param transaction
 * @param shopId
 * @param stock 元のStock
 * @param altStock 入れ替えるStock
 */
function swapAndReceiveStock(transaction: Transaction, shopId: string, stock: Stock, altStock: Stock) {
    const altStockRef = stockRef(shopId, altStock.id);
    const stRef = stockRef(shopId, stock.id);
    const altStockOrderRef = orderRef(shopId, altStock.orderRef.id);
    const stOrderRef = orderRef(shopId, stock.orderRef.id);

    // StockをUpdate
    try {
        transaction.update(altStockRef, {
            status: 'received',
            orderRef: stock.orderRef
        } as StockForUpdate)

        transaction.update(stRef, {
            orderRef: altStockOrderRef
        } as StockForUpdate)

        // Order.stocksRefを交換
        transaction.update(stOrderRef, {
            stocksRef: arrayRemove(stRef)
        } as OrderForUpdate)

        transaction.update(stOrderRef, {
            stocksRef: arrayUnion(altStockRef)
        } as OrderForUpdate)

        transaction.update(altStockOrderRef, {
            stocksRef: arrayRemove(altStockRef)
        } as OrderForUpdate)

        transaction.update(altStockOrderRef, {
            stocksRef: arrayUnion(stRef)
        } as OrderForUpdate)
    } catch (e) {
        console.error(e);
    }
}