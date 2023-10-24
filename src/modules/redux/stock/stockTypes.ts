import {DocumentReference, FieldValue, Timestamp} from "firebase/firestore";

export type StockStatus = "idle" | "working" | "completed"

/**
 * 在庫ドキュメント
 * @param barista_id 担当するバリスタのID
 * @param start_working_at statusをworkingにした時刻
 * @param orderRef 対応する注文のref
 */
export type StockTemplate<T extends Timestamp | FieldValue> = {
    id: string
    status: StockStatus
    product_id: string
    barista_id: number
    created_at: T
    start_working_at: T
    orderRef: DocumentReference
    spend_to_make: number,
}

export type Stock = StockTemplate<Timestamp>;
type StockFieldValue = StockTemplate<FieldValue>;

export type StockFroAdd = Omit<StockFieldValue, "id" | "created_at" | "start_working_at" | "barista_id" | "status" | "orderRef" | "spend_to_make">;
export type StockForUpdate = Partial<StockFieldValue>;
export type PayloadStock = Omit<StockFieldValue, 'id'>;

export function assertStock(data: any): asserts data is Stock {
    const d = data as Partial<Stock>;

    if (
        !(
            typeof d?.barista_id === 'number' &&
            typeof d?.status === 'string' &&
            typeof d?.product_id === 'string' &&
            d?.created_at instanceof Timestamp &&
            d?.start_working_at instanceof Timestamp
        )
    ) {
        throw new Error("data is not order type");
    }
}