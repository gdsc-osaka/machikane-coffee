import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import {Stock, StockForUpdate, StockStatus} from "./stockTypes";
import {
    collection,
    doc,
    increment,
    limit,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    where
} from "firebase/firestore";
import {db} from "../../firebase/firebase";
import {stockConverter} from "../../firebase/converters";
import {stockAdded, stockIdle, stockRemoved, stockSucceeded, stockUpdated} from "./stocksSlice";
import {productRef} from "../product/productsThunk";
import {ProductForUpdate} from "../product/productTypes";
import {today} from "../../util/dateUtils";

const stocksCollection = (shopId: string) => query(
    collection(db, `shops/${shopId}/stocks`),
    where("created_at", ">=", today),

);
export const stockRef = (shopId: string, stockId: string) =>
    doc(db, `shops/${shopId}/stocks/${stockId}`).withConverter(stockConverter)

export const streamStocks = (shopId: string, {dispatch}: { dispatch: Dispatch }) => {
    dispatch(stockSucceeded({shopId}))

    const _query = stocksCollection(shopId);
    const unsub = onSnapshot(_query, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                if (change.doc.metadata.hasPendingWrites) {
                    return;
                }
                const stock = stockConverter.fromFirestore(change.doc);
                dispatch(stockAdded({shopId, stock}));
            }
            if (change.type === "modified") {
                const data = change.doc.data();
                const stockForUpdate: StockForUpdate = {...data, id: change.doc.id};
                dispatch(stockUpdated({shopId, stock: stockForUpdate}));
            }
            if (change.type === "removed") {
                const stockId = change.doc.id;
                dispatch(stockRemoved({shopId, stockId}));
            }
        });
    });

    return () => {
        dispatch(stockIdle({shopId}));
        unsub();
    }
}

/* StockはaddOrderから追加される
export const addStock = createAsyncThunk<
    {shopId: string, stock: Stock},
    {shopId: string, stockForAdd: StockFroAdd},
    {}
>('stocks/addStock', async ({shopId, stockForAdd}, {rejectWithValue}) => {
    const payload: PayloadStock = {
        orderRef: undefined,
        spend_to_make: 0,
        ...stockForAdd,
        status: "idle",
        barista_id: 0,
        created_at: serverTimestamp(),
        start_working_at: serverTimestamp()
    }

    try {
        const addedDoc = await addDoc(stocksRef(shopId), payload);
        const stock: Stock = {
            ...payload,
            id: addedDoc.id,
            created_at: Timestamp.now(),
            start_working_at: Timestamp.now()
        }

        return {shopId, stock}
    } catch (e) {
        return rejectWithValue(e)
    }
})
 */

export const updateStockStatus = createAsyncThunk<
    { shopId: string, stock: StockForUpdate },
    { shopId: string, stock: Stock, status: StockStatus, baristaId: number },
    {}
>('stocks/changeStockStatus', async ({shopId, stock, status, baristaId}, {rejectWithValue}) => {
    const stockForUpdate: StockForUpdate = {
        status: status,
        barista_id: baristaId
    }

    if (status === 'working') {
        stockForUpdate.start_working_at = serverTimestamp();
    }

    try {
        const stRef = stockRef(shopId, stock.id);

        await runTransaction(db, async (transaction) => {
            const latestStockSnapshot = await transaction.get(stRef);
            if (!latestStockSnapshot.exists()) return Promise.reject('該当するStockが見つかりません');
            const latestStock = latestStockSnapshot.data();
            /// 既に状態がstatusに変わっていたら処理をやめる
            if (latestStock.status === status) return Promise.reject('Stockのstatusは既に変更されています.');

            if (status === 'completed') {
                transaction.update(productRef(shopId, stock.product_id), {
                    stock: increment(1)
                } as ProductForUpdate)
                stockForUpdate.completed_at = serverTimestamp();
            }

            transaction.update(stRef, stockForUpdate)
        });

        return {
            shopId,
            stock: stockForUpdate
        }
    } catch (e) {
        return rejectWithValue(e)
    }
})