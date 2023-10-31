import {DocumentReference, FieldValue, Timestamp} from "firebase/firestore";

/**
 * 商品IDと個数のマップ
 */
export type ProductAmount = {
    [K in string]: number
};

/**
 * 商品IDと提供の状況 (受け取り済み、完成済み)
 * @property product_id 商品ID
 * @property status 初期状態(idle),受取済(received)のいずれか
 */
export type ProductStatus = {
    product_id: string;
    status: "idle" | "received";
}

/**
 * 注文ドキュメント
 * @param created_at 注文が作成された時刻
 * @param delay_seconds 店舗が提供中止になったことで遅延した秒数
 * @param stocksRef 対応するStockのref
 * @param product_status 一つ一つの商品が受け取られたか否かを保存する
 * @param required_product_amount これ以前の注文も合わせた商品種ごとの必要な商品数
 */
type OrderTemplate<T extends Timestamp | FieldValue, N extends number | FieldValue, D extends DocumentReference[] | FieldValue> = {
    id: string;
    index: number;
    created_at: T;
    delay_seconds: N;
    status: "idle" | "received";
    stocksRef: D;
    product_status: {
        [k in string]: ProductStatus
    }
    required_product_amount: {
        [product_id in string]: N
    }
    // データ追加時は以下のみ
    product_amount: ProductAmount;
};

export type Order = OrderTemplate<Timestamp, number, DocumentReference[]>;

/**
 * データの追加時、ユーザーが設定しなければいけないフィールドのみにした order
 */
export type OrderForAdd = Omit<Order, "id" | "index" | "created_at" | "delay_seconds" | "status" |
    "product_status" | "required_product_amount" | "stocksRef">;

/**
 * データの更新時に使用する Order
 */
export type OrderForUpdate = Partial<OrderTemplate<FieldValue | Timestamp, FieldValue | number, FieldValue | DocumentReference[]>> & {
    [k in `required_product_amount.${string}`]: FieldValue
};

/**
 * データを Firestore に送信するとき, 一部フィールドを FieldValue に変更するための型
 */
export type PayloadOrder = Omit<OrderTemplate<FieldValue, number, DocumentReference[]>, 'id'>


export function assertOrder(data: any): asserts data is Order {
    const d = data as Partial<Order>; // 補完のためキャスト
    if (
        !(
            // FIXME: product_amount の条件を追加
            typeof d?.id === "string" &&
            typeof d?.index === "number" &&
            d?.created_at instanceof Timestamp
        )
    ) {
        throw new Error("data is not order type");
    }
}