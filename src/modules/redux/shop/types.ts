import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

export type Shop = {
    id: string;
    status: "active" | "pause_ordering";
    last_active_time: Timestamp;
};

export function assertShop(data: any): asserts data is Shop {
    const d = data as Partial<Shop>; // 補完のためキャスト
    if (
        !(
            typeof d?.id === "string" &&
            typeof d?.status === "string" &&
            d?.last_active_time instanceof Timestamp
        )
    ) {
        throw new Error("data is not Shop type");
    }
}