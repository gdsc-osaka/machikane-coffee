import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {Shop, ShopStatus} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter, shopConverter} from "../../firebase/converters";
import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;
import {RootState} from "../store";

export const fetchShop = createAsyncThunk("shop/fetchShop",
    async (shopId: string, {rejectWithValue}) => {
    const shopRef = db.collection('shops').doc(shopId);
    const snapshot = await shopRef.withConverter(shopConverter).get();

    if (snapshot.exists) {
        const data = snapshot.data();

        if (data == undefined) {
            // ドキュメントの型不一致などで data が undefined のとき, エラーを返す.
            throw rejectWithValue(`Data of ${shopId} is undefined!`);
        }

        return data;
    } else {
        // shopId のドキュメントが存在しない場合, エラーを返す.
        throw rejectWithValue(`Document ${shopId} doesn't exist in shops collection of firestore!`);
    }
});

export const addShop = createAsyncThunk("shop/addShop",
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

export const updateShop = createAsyncThunk("shop/updateShop",
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
("shop/changeShopStatus",
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
        let shop = getState().shop.data;

        // State に shop データがない場合, フェッチする
        if (shop == null) {
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
    name: "shop",
    initialState: {
        data: null,
        status: "idle",
        error: null,
    } as AsyncState<Shop | null>,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchShop.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(fetchShop.fulfilled, (state, action) => {
                state.status = 'succeeded'
                // Add any fetched posts to the array
                state.data = action.payload;
            })
            .addCase(fetchShop.rejected, (state, action) => {
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
            .addCase(updateShop.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(updateShop.fulfilled, (state, action) => {
                state.status = 'succeeded'
            })
            .addCase(updateShop.rejected, (state, action) => {
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