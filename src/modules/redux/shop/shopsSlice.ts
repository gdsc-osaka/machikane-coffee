import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {RawShop, Shop, ShopStatus} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter, shopConverter} from "../../firebase/converters";
import {RootState} from "../store";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query, runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc, where
} from "firebase/firestore";

const shopsRef = collection(db, "shops").withConverter(shopConverter);
const shopRef = (shopId: string) => doc(db, `shops/${shopId}`).withConverter(shopConverter);

export const fetchShops = createAsyncThunk("shops/fetchShops",
    async () => {
    const snapshot = await getDocs(shopsRef);
    return snapshot.docs.map(doc => doc.data());
});

export const addShop = createAsyncThunk("shops/addShop",
    async ({shopId, rawShop}: {shopId: string, rawShop: RawShop}) => {
        const shopData: Shop = {
            ...rawShop,
            id: shopId,
            last_active_time: Timestamp.now(),
            status: "active"
        };
        await setDoc(shopRef(shopId), shopData);
        return shopData;
    })

export const updateShop = createAsyncThunk<Shop | undefined, {shopId: string, rawShop: RawShop}, {state: RootState}>("shops/updateShop",
    async ({shopId, rawShop}, {getState, rejectWithValue}) => {
        try {
            await updateDoc(shopRef(shopId), rawShop);
            const oldShop = selectShopById(getState(), shopId);

            if (oldShop != undefined) {
                const newShop: Shop = {
                    ...oldShop,
                    ...rawShop
                }
                return newShop;
            } else {
                rejectWithValue(`Shop ${shopId} doesn't exist in state!`)
                return undefined;
            }

        } catch {
            rejectWithValue(`Shop ${shopId} doesn't exist in database!`)
            return undefined;
        }
    })

export const changeShopStatus = createAsyncThunk<Shop | undefined, {shopId: string, status: ShopStatus}, {state: RootState}>
("shops/changeShopStatus",
    async ({shopId, status}, {getState}) => {
        const _shopRef = shopRef(shopId);

        if (status == "pause_ordering") {
            // 注文停止時はショップのデータを書き換える
            await updateDoc(_shopRef, {
                status: status,
                last_active_time: serverTimestamp(),
            });

            // TODO: FieldValue の更新があるので get しているが, 多少の誤差は許容して get を呼ばないようにする?
            const snapshot = await getDoc(_shopRef);
            return snapshot.data();

        } else if (status == "active") {
            // 注文再開時はオーダーの完了時刻を書き換える
            let shop = selectShopById(getState(), shopId);

            // State に shop データがない場合, フェッチする
            if (shop == undefined) {
                const snapshot = await getDoc(_shopRef);
                const shopData = snapshot.data();
                if (shopData != undefined) shop = shopData;
            }

            const lastActiveTime = shop!.last_active_time;
            // 最後に営業してた時刻からどれだけ経過したか
            const delayedTime = Date.now() - lastActiveTime.toDate().getTime();

            // 注文を取得
            const _query = query(collection(db, `shops/${shopId}/orders`).withConverter(orderConverter), where('complete_at', '<=', lastActiveTime), where('received', '==', true));
            const ordersSnapshot = await getDocs(_query);

            try {
                await runTransaction( db, async (transaction) => {
                    for (const doc of ordersSnapshot.docs) {
                        // 遅延時間分を可算
                        const order = doc.data();
                        const newCompleteAt = new Date(order.complete_at.toDate().getTime() + delayedTime);
                        transaction.update(doc.ref, {
                            complete_at: Timestamp.fromDate(newCompleteAt)
                        })
                    }
                    // 店のステータスをactiveに変更
                    transaction.update(_shopRef, {
                        status: status
                    })
                })
                const newShop = selectShopById(getState(), shopId);
                if (newShop != undefined) {
                    newShop.status = status;
                }
                return newShop;
            } catch {
                return undefined;
            }
        }
    })


const shopsSlice = createSlice({
    name: "shops",
    initialState: {
        data: [],
        status: "idle",
        error: null,
    } as AsyncState<Shop[]>,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchShops.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(fetchShops.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data = action.payload;
            })
            .addCase(fetchShops.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })

        builder
            .addCase(addShop.fulfilled, (state, action) => {
                state.data.push(action.payload);
            })

        builder
            .addCase(updateShop.fulfilled, (state, action) => {
                const updatedShop = action.payload;

                if (updatedShop != undefined) {
                    state.data.update(e => e.id == updatedShop.id, updatedShop);
                }
            })

        builder
            .addCase(changeShopStatus.fulfilled, (state, action) => {
                const shop = action.payload;
                if (shop != undefined) {
                    state.data.update(e => e.id == shop.id, shop);
                }
            })
    }
});

const shopReducer = shopsSlice.reducer;
export default shopReducer;

/**
 * shopId と一致する Shop エンティティを返す
 * @param state RootState
 * @param shopId Shop の ID
 */
export const selectShopById = (state: RootState, shopId: string) => state.shop.data.find(e => e.id == shopId);
export const selectAllShops = (state: RootState) => state.shop.data;
export const selectShopStatus = (state: RootState) => state.shop.status;