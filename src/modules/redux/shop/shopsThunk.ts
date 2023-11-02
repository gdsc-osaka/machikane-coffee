import {createAsyncThunk, Dispatch} from "@reduxjs/toolkit";
import {Shop, ShopForAdd, ShopForUpdate, ShopStatus} from "./shopTypes";
import {RootState} from "../store";
import {
    collection,
    doc,
    getDocs,
    increment,
    onSnapshot,
    runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc
} from "firebase/firestore";
import {db} from "../../firebase/firebase";
import {shopConverter} from "../../firebase/converters";
import {selectShopById, shopIdle, shopRemoved, shopSucceeded, shopUpdated} from "./shopsSlice";
import {ordersQuery} from "../order/ordersThunk";

const shopsRef = collection(db, "shops").withConverter(shopConverter);
const shopRef = (shopId: string) => doc(db, `shops/${shopId}`).withConverter(shopConverter);
export const fetchShops = createAsyncThunk("shops/fetchShops",
    async () => {
        const snapshot = await getDocs(shopsRef);
        return snapshot.docs.map(doc => doc.data());
    });
/**
 * shopをリアルタイム更新する.
 */
export const streamShop = (shopId: string, {dispatch}: {dispatch: Dispatch}) => {
    const unsubscribe = onSnapshot(shopRef(shopId), (snapshot) => {
        if (snapshot.exists()) {
            const shop = snapshot.data();
            dispatch(shopUpdated(shop));
        } else {
            dispatch(shopRemoved(shopId));
        }
        dispatch(shopSucceeded());
    });

    return () => {
        dispatch(shopIdle())
        unsubscribe();
    };
}
export const addShop = createAsyncThunk("shops/addShop",
    async ({shopId, shopForAdd}: { shopId: string, shopForAdd: ShopForAdd }) => {
        const shop: Shop = {
            ...shopForAdd,
            id: shopId,
            last_active_time: Timestamp.now(),
            status: "active"
        };
        await setDoc(shopRef(shopId), shop);
        return shop;
    })
export const updateShop = createAsyncThunk<Shop | undefined, { shopId: string, rawShop: ShopForAdd }, {
    state: RootState
}>("shops/updateShop",
    async ({shopId, rawShop}, {getState, rejectWithValue}) => {
        try {
            await updateDoc(shopRef(shopId), rawShop);
            const oldShop = selectShopById(getState(), shopId);

            if (oldShop !== undefined) {
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
export const changeShopStatus = createAsyncThunk<
    Shop,
    { shop: Shop, status: ShopStatus, emgMsg?: string },
    {}
>("shops/changeShopStatus", async ({shop, status, emgMsg}, {rejectWithValue}) => {
        const shopId = shop.id;
        const _shopRef = shopRef(shopId);

        if (status === "pause_ordering") {
            // 注文停止時はショップのデータを書き換える
            await updateDoc(_shopRef, {
                status: status,
                last_active_time: serverTimestamp(),
                emg_message: emgMsg
            } as ShopForUpdate);

            return {
                ...shop,
                status,
                last_active_time: Timestamp.now(),
                emg_message: emgMsg
            } as Shop;

        } else if (status === "active") {
            // 注文再開時は注文の完了時刻を書き換える


            // 注文を取得
            const q = ordersQuery(shopId);

            try {
                const ordersSnapshot = await getDocs(q);

                await runTransaction(db, async (transaction) => {
                    const shopSnapshot = await transaction.get(_shopRef);
                    const latestShop = shopSnapshot.data();

                    const lastActiveTime = latestShop ? latestShop.last_active_time : shop.last_active_time;
                    // 最後に営業してた時刻からどれだけ経過したか
                    const delaySeconds = Math.floor((new Date().getTime() - lastActiveTime.toMillis()) / 1000);

                    for (const doc of ordersSnapshot.docs) {
                        // 遅延時間分を可算
                        transaction.update(doc.ref, {
                            delay_seconds: increment(delaySeconds)
                        })
                    }

                    // 店のステータスをactiveに変更
                    transaction.update(_shopRef, {
                        status: status
                    })
                });

                return {
                    ...shop,
                    status
                } as Shop;
            } catch (e) {
                rejectWithValue(e);
            }
        }

        // status == active, pause以外は何もしない
        return shop;
    })