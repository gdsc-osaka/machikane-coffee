import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import {Stock, StockForUpdate, StockStatus} from "./stockTypes";
import {collection, doc, onSnapshot, serverTimestamp, Timestamp, updateDoc} from "firebase/firestore";
import {db} from "../../firebase/firebase";
import {stockConverter} from "../../firebase/converters";
import {QueryConstraint} from "@firebase/firestore";
import {stockAdded, stockRemoved, stockSucceeded, stockUpdated} from "./stocksSlice";

const stocksRef = (shopId: string) =>
    collection(db, `shops/${shopId}/stocks`).withConverter(stockConverter);
const stockRef = (shopId: string, stockId: string) =>
    doc(db, `shops/${shopId}/stocks/${stockId}`).withConverter(stockConverter)

export const streamStocks = (shopId: string, {dispatch}: { dispatch: Dispatch }, ...queryConstraints: QueryConstraint[]) => {
    dispatch(stockSucceeded({shopId}))

    const _query = stocksRef(shopId);
    return onSnapshot(_query, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.doc.metadata.hasPendingWrites) {
                return;
            }

            if (change.type === "added") {
                const stock = change.doc.data();
                dispatch(stockAdded({shopId, stock}));
            }
            if (change.type === "modified") {
                const stock = change.doc.data();
                dispatch(stockUpdated({shopId, stock}));
            }
            if (change.type === "removed") {
                const stockId = change.doc.id;
                dispatch(stockRemoved({shopId, stockId}));
            }
        });
    });
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
    {shopId: string, stock: Stock},
    {shopId: string, stock: Stock, status: StockStatus, baristaId: number},
    {}
>('stocks/changeStockStatus', async ({shopId, stock, status, baristaId}, {rejectWithValue}) => {
    const stockForUpdate: StockForUpdate = {
        status: status,
        start_working_at: serverTimestamp(),
        barista_id: baristaId
    }

    try {
        await updateDoc(stockRef(shopId, stock.id), stockForUpdate);

        return {
            shopId,
            stock: {
                ...stock,
                status: status,
                start_working_at: status === 'working' ? Timestamp.now() : stock.start_working_at
            }
        }
    } catch (e) {
        return rejectWithValue(e)
    }
})