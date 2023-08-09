import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;
import FieldValue = firebase.firestore.FieldValue;
import {Weaken} from "../../util/typeUtils";

/**
 * 商品IDと個数のマップ
 */
export type ProductAmount = {
    [K in string]: number
};

/**
 * 商品IDと提供の状況 (受け取り済み、完成済み)
 */
export type OrderStatus = {
    product_id: string;
    received: boolean;
    completed: boolean;
}

/**
 * 注文情報
 * @property order_statuses それぞれの商品の提供状況のリスト
 * @property complete_at 商品が完成する時間
 * @property completed 商品が完成したかどうか
 * @property is_student 客が生徒がどうか
 */
export type Order = {
    id: string;
    index: number;
    created_at: Timestamp;
    complete_at: Timestamp;
    received: boolean;
    completed: boolean;
    order_statuses: OrderStatus[];
    // データ追加時は以下のみ
    product_amount: ProductAmount;
    is_student: boolean;
};

/**
 * データの追加時、ユーザーが設定しなければいけないフィールドのみにした Order
 */
export type RawOrder = Omit<Order, "id" | "index" | "created_at" | "complete_at" | "received">;

/**
 * データを Firestore に送信するとき, 一部フィールドを FieldValue に変更するための型
 */
export type CargoOrder = Weaken<Omit<Order, 'id'>, 'created_at'> & {
    created_at: FieldValue | Timestamp
}


export function assertOrder(data: any): asserts data is Order {
    const d = data as Partial<Order>; // 補完のためキャスト
    if (
        !(
            // FIXME: product_amount の条件を追加
            typeof d?.id === "string" &&
            typeof d?.index === "number" &&
            d?.created_at instanceof Timestamp &&
            d?.complete_at instanceof Timestamp &&
            typeof d?.received === "boolean" &&
            typeof d?.is_student === "boolean"
        )
    ) {
        throw new Error("data is not Order type");
    }
}