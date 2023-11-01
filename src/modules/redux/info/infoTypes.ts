import {FieldValue, Timestamp} from "firebase/firestore";

type OrderInfoTemplate<N extends number | FieldValue, T extends Timestamp | FieldValue> = {
    last_order_index: N;
    reset_at: T;
}

/**
 * 店の情報を保存するドキュメントの型. Transactionで使用する
 * @param last_order_index その日の最新の注文の番号
 * @param reset_at OrderInfoが最後にリセットされたTimestamp. 通常は Functions によって自動的にリセットされる.
 */
export type OrderInfo = OrderInfoTemplate<number, Timestamp>;
export type OrderInfoForAdd = OrderInfoTemplate<number, FieldValue>;
export type OrderInfoForUpdate = Partial<OrderInfoTemplate<FieldValue, FieldValue>>;

export function assertOrderInfo(data: any): asserts data is OrderInfo {
    const d = data as Partial<OrderInfo>;

    if (typeof d.last_order_index !== "number")  {
        throw new Error('data is not OrderInfo type.')
    }
}