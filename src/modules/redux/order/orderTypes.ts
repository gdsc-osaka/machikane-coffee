import {FieldValue, Timestamp} from "firebase/firestore";

/**
 * 商品IDと個数のマップ
 */
export type ProductAmount = {
    [K in string]: number
};

export type Status = "idle" | "working" | "completed"

/**
 * 商品IDと提供の状況 (受け取り済み、完成済み)
 * @property product_id 商品ID
 * @property status 初期状態(idle), 作成中(working), 完成済み(completed) のいずれか
 * @property barista_id 担当中のbaristaのid
 * @property start_working_at statusがworkingになった時刻
 */
export type OrderStatus<T extends Timestamp | FieldValue> = {
    product_id: string;
    status: Status;
    barista_id: number;
    start_working_at: T;
}

/**
 * OrderStatus のマップ. キーは任意の文字列
 */
export type OrderStatuses<T extends Timestamp | FieldValue> = {
    [K in string]: OrderStatus<T>
}

type OrderTemplate<T extends Timestamp | FieldValue> = {
    id: string;
    index: number;
    created_at: T;
    complete_at: Timestamp;
    delay_seconds: number;
    status: "idle" | "completed" | "received";
    order_statuses: OrderStatuses<T>;
    // データ追加時は以下のみ
    product_amount: ProductAmount;
    is_student: boolean;
};

/**
 * 注文情報
 * @property order_statuses それぞれの商品の提供状況のリスト
 * @property complete_at 商品が完成する時間
 * @property completed 商品が完成したかどうか
 * @property is_student 客が生徒がどうか
 */
export type Order = OrderTemplate<Timestamp>;

/**
 * データの追加時、ユーザーが設定しなければいけないフィールドのみにした order
 */
export type OrderForAdd = Omit<Order, "id" | "index" | "created_at" | "complete_at" | "order_statuses" | "delay_seconds">;

/**
 * データの更新時に使用する Order
 */
export type OrderForUpdate = Partial<Order>;

/**
 * データを Firestore に送信するとき, 一部フィールドを FieldValue に変更するための型
 */
export type PayloadOrder = Omit<OrderTemplate<FieldValue>, 'id'>


export function assertOrder(data: any): asserts data is Order {
    const d = data as Partial<Order>; // 補完のためキャスト
    if (
        !(
            // FIXME: product_amount の条件を追加
            typeof d?.id === "string" &&
            typeof d?.index === "number" &&
            d?.created_at instanceof Timestamp &&
            d?.complete_at instanceof Timestamp
        )
    ) {
        throw new Error("data is not order type");
    }
}