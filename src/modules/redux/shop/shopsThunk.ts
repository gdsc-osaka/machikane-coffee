import {createAsyncThunk} from "@reduxjs/toolkit";
import {Shop, ShopForAdd, ShopStatus} from "./shopTypes";
import {RootState} from "../store";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import {db} from "../../firebase/firebase";
import {orderConverter, shopConverter} from "../../firebase/converters";
import {getToday} from "../../util/dateUtils";
import {selectShopById, shopAdded, shopRemoved, shopUpdated} from "./shopsSlice";

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
export const streamShop = createAsyncThunk('orders/streamShops',
    (shopId: string, {dispatch, getState}) => {
        const unsubscribe = onSnapshot(shopRef(shopId), (snapshot) => {
            const state: RootState = getState() as RootState;
            const shop = snapshot.data();

            if (shop !== undefined) {
                if (state.shop.data.findIndex(e => e.id === shop.id) === -1) {
                    // 同じドキュメントが存在しなければ
                    dispatch(shopAdded(shop));
                } else {
                    dispatch(shopUpdated(shop));
                }
            } else {
                dispatch(shopRemoved(shopId));
            }
        });

        return unsubscribe;
    })
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
export const changeShopStatus = createAsyncThunk<Shop | undefined, { shopId: string, status: ShopStatus }, {
    state: RootState
}>
("shops/changeShopStatus",
    async ({shopId, status}, {getState}) => {
        const _shopRef = shopRef(shopId);

        if (status === "pause_ordering") {
            // 注文停止時はショップのデータを書き換える
            await updateDoc(_shopRef, {
                status: status,
                last_active_time: serverTimestamp(),
            });

            // TODO: FieldValue の更新があるので get しているが, 多少の誤差は許容して get を呼ばないようにする?
            const snapshot = await getDoc(_shopRef);
            return snapshot.data();

        } else if (status === "active") {
            // 注文再開時はオーダーの完了時刻を書き換える

            // last_active_time を取得
            const snapshot = await getDoc(_shopRef);
            const shop = snapshot.data();
            const lastActiveTime = shop!.last_active_time;
            // 最後に営業してた時刻からどれだけ経過したか
            const delaySeconds = new Date().getSeconds() - lastActiveTime.toDate().getSeconds();

            // 注文を取得
            const _query = query(
                collection(db, `shops/${shopId}/orders`).withConverter(orderConverter),
                where('created_at', '>=', Timestamp.fromDate(getToday())),
                where('completed', '==', false));

            try {
                const ordersSnapshot = await getDocs(_query);

                const newShop = selectShopById(getState(), shopId);

                try {
                    await runTransaction(db, async (transaction) => {

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
                    })
                    if (newShop !== undefined) {
                        newShop.status = status;
                    }
                    return newShop;
                } catch {
                    return newShop;
                }
            } catch (e) {
                console.log(e);
            }

        }
    })