import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AsyncState} from "../stateType";
import {CargoOrder, Order, OrderStatus, RawOrder} from "./types";
import {db} from "../../firebase/firebase";
import {orderConverter} from "../../firebase/converters";
import firebase from "firebase/compat";
import {selectProductById} from "../product/productsSlice";
import {RootState} from "../store";
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;

export const fetchOrders = createAsyncThunk("orders/fetchOrders",
    async (shopId: string) => {
        const shopRef = db.collection("shops").doc(shopId);
        const snapshot = await shopRef
            .collection("orders")
            .withConverter(orderConverter)
            .get();

        return snapshot.docs.map(doc => doc.data());
    });

export const addOrder = createAsyncThunk<Order | undefined, {shopId: string, rawOrder: RawOrder}, {state: RootState}>("orders/addOrder",
    async ({shopId, rawOrder}, {getState, dispatch}) => {
        const shopRef = db.collection("shops").doc(shopId);
        const ordersRef = shopRef.collection("orders");

        // トランザクションのフィルターで使う
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0); // 0時0分に合わせる
        const today = Timestamp.fromDate(todayDate);

        // TODO: 直列と考えて待ち時間を計算しているので、並列にも対応させる
        // 注文の待ち時間 (秒)
        let waitingSec = 0;
        // 提供状況
        const orderStatuses: OrderStatus[] = [];

        for (const productId in Object.keys(rawOrder.product_amount)) {
            const amount = rawOrder.product_amount[productId];
            const product = selectProductById(getState(), productId);

            // Product が登録されているまたはフェッチされているとき
            if (product != null) {
                waitingSec += product.span * amount;
            }

            // 商品とその数のぶんだけ orderStatuses を追加
            for (let i = 0; i < amount; i++) {
                orderStatuses.push({
                   product_id: productId,
                   received: false,
                   completed: false,
                });
            }
        }
        const completeAt = new Date().addSeconds(waitingSec).toTimestamp();

        const order: CargoOrder = {
            is_student: rawOrder.is_student,
            product_amount: rawOrder.product_amount,
            index: 1,
            created_at: FieldValue.serverTimestamp(),
            complete_at: completeAt,
            received: false,
            completed: false,
            order_statuses: orderStatuses
        }

        // 連番を処理するためにトランザクション使用
        return db.runTransaction(async (transaction) => {
            const lastOrderSnapshot = await ordersRef
                .orderBy('created_at', 'desc')
                .where('created_at', '>=', today)
                .limit(1)
                .withConverter(orderConverter)
                .get();

            // 今日この注文以前に注文があった場合、最新の注文の index + 1 を今回の注文の番号にする
            if (!lastOrderSnapshot.empty) {
                const lastOrder = lastOrderSnapshot.docs[0].data();
                order.index = lastOrder.index + 1;
            }

            // ランダムIDで追加
            const addedDoc = await ordersRef.add(order);
            // ドキュメントを取得してStoreに追加
            const addedOrderSnapshot = await addedDoc.withConverter(orderConverter).get();
            return addedOrderSnapshot.data();
        });
    });

/**
 * 注文を更新する. UIで操作された部分のみ更新すれば, その更新に依存するそれ以外の部分も自動で書き換えられる (completed 等)
 */
const updateOrder = createAsyncThunk('orders/updateOrder',
    async ({shopId, newOrder}: {shopId: string, newOrder: Order}) => {
        const shopRef = db.collection("shops").doc(shopId);
        const orderRef = shopRef.collection('orders').doc(newOrder.id);

        // OrderStatus: 親オーダーが true なら 子オーダー全て true, 子オーダー全て true なら親オーダーも true
        if (newOrder.completed) {
            newOrder.order_statuses.forEach(e => e.completed = true);
        } else if (newOrder.order_statuses.findIndex(e => !e.completed) == -1) {
            // order_statuses が全て completed のとき
            newOrder.completed = true;
        }

        if (newOrder.received) {
            newOrder.order_statuses.forEach(e => e.received = true);
        } else if (newOrder.order_statuses.findIndex(e => !e.received) == -1) {
            // order_statuses が全て received のとき
            newOrder.received = true;
        }

        await orderRef.withConverter(orderConverter).update(newOrder);
        return newOrder;
    });

const ordersSlice = createSlice({
    name: "orders",
    initialState: {
        data: [],
        status: 'idle',
        error: null,
    } as AsyncState<Order[]>,
    reducers: {
    },
    extraReducers: builder => {
        builder
            .addCase(fetchOrders.pending, (state, action) => {
                state.status = 'loading'
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.status = 'succeeded'
                state.data = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.status = 'failed'
                const msg = action.error.message;
                state.error = msg == undefined ? null : msg;
            })

        builder.addCase(addOrder.fulfilled, (state, action) => {
            const order = action.payload;
            if (order != undefined) {
                state.data.push(order);
            }
        })

        builder.addCase(updateOrder.fulfilled, (state, action) => {
           const newOrder = action.payload;
           state.data.update(e => e.id == newOrder.id, newOrder);
        });
    },
});

const orderReducer = ordersSlice.reducer;
export default orderReducer;