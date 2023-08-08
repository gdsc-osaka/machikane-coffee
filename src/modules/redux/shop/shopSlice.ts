import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {Shop, ShopStatus} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter, shopConverter} from "../../firebase/converters";
import firebase from "firebase/compat";
import {RootState} from "../store";
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;

export const fetchShops = createAsyncThunk("shops/fetchShops",
    async () => {
    const shopsRef = db.collection('shops');
    const snapshot = await shopsRef.withConverter(shopConverter).get();
    return snapshot.docs.map(doc => doc.data());
});

export const addShop = createAsyncThunk("shops/addShop",
    async ({shopId, displayName}: {shopId: string, displayName: string}) => {
        const shopData: Shop = {
            display_name: displayName,
            id: shopId,
            last_active_time: Timestamp.now(),
            status: "active"
        };
        const shopRef = db.collection('shops').doc(shopId);
        return  await shopRef.withConverter(shopConverter).set(shopData);
    })

export const updateShopName = createAsyncThunk("shops/updateShop",
    async ({shopId, displayName}: {shopId: string, displayName: string}) => {
        const data = {
            // FIXME: フィールド名が独立していない (Shop型が変更されたらバグる)
            display_name: displayName
        };

        const shopRef = db.collection('shops').doc(shopId);
        return await shopRef.withConverter(shopConverter).update(data);
    })

type changeShopStatusArgs = {shopId: string, status: ShopStatus};

export const changeShopStatus = createAsyncThunk<void, changeShopStatusArgs, {state: RootState}>
("shops/changeShopStatus",
    async ({shopId, status}: changeShopStatusArgs, {getState}) => {
        const shopRef = db.collection('shops')
            .doc(shopId).withConverter(shopConverter);

    if (status == "pause_ordering") {
        // 注文停止時はショップのデータを書き換える
        return await shopRef.update({
            status: status,
            last_active_time: FieldValue.serverTimestamp(),
        });
    } else if (status == "active") {
        // 注文再開時はオーダーの完了時刻を書き換える
        let shop = selectShop(getState(), shopId);

        // State に shop データがない場合, フェッチする
        if (shop == undefined) {
            const snapshot = await shopRef.get();
            const shopData = snapshot.data();
            if (shopData != undefined) shop = shopData;
        }

        const lastActiveTime = shop!.last_active_time;
        // 最後に営業してた時刻からどれだけ経過したか
        const delayedTime = Date.now() - lastActiveTime.toDate().getTime();

        // 注文を取得
        const ordersSnapshot = await shopRef.collection("orders")
            .withConverter(orderConverter)
            .where('complete_at', '<=', lastActiveTime)
            .where('received', '==', true)
            .get();


        return db.runTransaction( async (transaction) => {
            for (const doc of ordersSnapshot.docs) {
                // 遅延時間分を可算
                const order = doc.data();
                const newCompleteAt = new Date(order.complete_at.toDate().getTime() + delayedTime);
                transaction.update(doc.ref, {
                  complete_at: Timestamp.fromDate(newCompleteAt)
                })
            }
            // 店のステータスをactiveに変更
            transaction.update(shopRef, {
                status: status
            })
        })
    }
    })


const shopSlice = createSlice({
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
            .addCase(addShop.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(addShop.fulfilled, (state, action) => {
                state.status = 'succeeded'
            })
            .addCase(addShop.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })

        builder
            .addCase(updateShopName.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(updateShopName.fulfilled, (state, action) => {
                state.status = 'succeeded'
            })
            .addCase(updateShopName.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })

        builder
            .addCase(changeShopStatus.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(changeShopStatus.fulfilled, (state, action) => {
                state.status = 'succeeded'
            })
            .addCase(changeShopStatus.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })
    }
});

const shopReducer = shopSlice.reducer;
export default shopReducer;

/**
 * shopId と一致する Shop エンティティを返す
 * @param state RootState
 * @param shopId Shop の ID
 */
export const selectShop = (state: RootState, shopId: string) => state.shop.data.find(e => e.id == shopId);