import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

export type ShopStatus = "active" | "pause_ordering"

export type Shop = {
    id: string;
    status: ShopStatus;
    last_active_time: Timestamp;
    display_name: string;
};

export function assertShop(data: any): asserts data is Shop {
    const d = data as Partial<Shop>; // 補完のためキャスト
    if (
        !(
            typeof d?.id === "string" &&
            typeof d?.status === "string" &&
            typeof d?.display_name === "string" &&
            d?.last_active_time instanceof Timestamp
        )
    ) {
        throw new Error("data is not Shop type");
    }
}