import {Timestamp} from "firebase/firestore";

export type ShopStatus = "active" | "pause_ordering" | "inactive"

/**
 * ドリップ係の番号とそのステータスのマップ
 */
export type BaristaMap = {
    [K in number]: "active" | "inactive"
}

/**
 * 店情報
 * @property emg_message 緊急時のメッセージ
 * @property message OrderPageの下部に表示されるやつ
 * @property last_active_time 最後に営業中だった時間
 * @property baristas BaristaMap
 */
export type Shop = {
    id: string;
    status: ShopStatus;
    emg_message: string;
    message: string;
    last_active_time: Timestamp;
    display_name: string;
    baristas: BaristaMap;
};

/**
 * データの追加時に不必要なフィールドを除いた Shop
 */
export type ShopForAdd = Omit<Shop, "id" | "status" | "last_active_time">

/**
 * データの更新時に使用する Shop
 */
export type ShopForUpdate = Partial<Shop>;

/**
 * データをFirestoreに送信するときに使用する
 */
export type PayloadShop = Omit<Shop, "id">

export function assertShop(data: any): asserts data is Shop {
    const d = data as Partial<Shop>; // 補完のためキャスト
    if (
        !(
            typeof d?.id === "string" &&
            typeof d?.status === "string" &&
            typeof d?.display_name === "string"
        )
    ) {
        throw new Error("data is not Shop type");
    }
}