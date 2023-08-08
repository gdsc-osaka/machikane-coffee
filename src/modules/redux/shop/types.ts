import firebase from "firebase/compat";
import Timestamp = firebase.firestore.Timestamp;

export type ShopStatus = "active" | "pause_ordering"

/**
 * 店情報
 * @property last_active_time 最後に営業中だった時間
 */
export type Shop = {
    id: string;
    status: ShopStatus;
    last_active_time: Timestamp;
    display_name: string;
};

/**
 * データの追加時に不必要なフィールドを除いた Shop
 */
export type RawShop = Omit<Shop, "id" | "status" | "last_active_time">

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