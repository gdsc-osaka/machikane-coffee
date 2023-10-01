import {FieldValue, Timestamp } from "firebase/firestore";
import {Weaken} from "../../util/typeUtils";

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
 */
export type OrderStatus = {
    product_id: string;
    status: Status;
    barista_id: number;

    /**
     * @deprecated status に統合
     */
    received: boolean;
    /**
     * @deprecated status に統合
     */
    completed: boolean;
}

/**
 * OrderStatus のマップ. キーは任意の文字列
 */
export type OrderStatuses = {
    [K in string]: OrderStatus
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
    delay_seconds: number;
    status: "idle" | "completed" | "received";
    order_statuses: OrderStatuses;
    // データ追加時は以下のみ
    product_amount: ProductAmount;
    is_student: boolean;

    /**
     * @deprecated status に統合
     */
    received: boolean;
    /**
     * @deprecated status に統合
     */
    completed: boolean;
};

/**
 * データの追加時、ユーザーが設定しなければいけないフィールドのみにした order
 */
export type RawOrder = Omit<Order, "id" | "index" | "created_at" | "complete_at" | "received" | "completed" | "order_statuses" | "delay_seconds">;

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
            d?.complete_at instanceof Timestamp
        )
    ) {
        throw new Error("data is not order type");
    }
}