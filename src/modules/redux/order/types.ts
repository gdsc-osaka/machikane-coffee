import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;
import {Shop} from "../shop/types";

export type ProductAmount = {
    [K in string]: number
};

export type Order = {
    id: string;
    index: number;
    product_amount: ProductAmount;
    created_at: Timestamp;
    complete_at: Timestamp;
    received: boolean;
    is_student: boolean;
};

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