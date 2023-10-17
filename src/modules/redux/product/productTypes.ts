import {Omit} from "@reduxjs/toolkit/dist/tsHelpers";

/**
 * 商品情報
 * @property id 商品ID. Firestoreには保存しない
 * @property display_name UIに表示する名前
 * @property span 提供にかかる時間、単位は秒
 * @property thumbnail_path FirebaseStorage上の商品画像のパス
 * @property thumbnail_url サムネイルのURL. thumbnail_pathのgetDownloadUrl() の結果を入れる. Firestoreには保存しない
 */
export type Product = {
    id: string;
    display_name: string;
    span: number;
    price: number;
    shorter_name: string;
    thumbnail_path: string;
    thumbnail_url: string;
};

/**
 * データをUIから入力するときに使用する
 */
export type ProductForAdd = Omit<Product, "thumbnail_path" | "thumbnail_url">;

/**
 * データの更新時に使用する
 */
export type ProductForUpdate = Partial<Product>;

/**
 * データをFirestoreに送信するときに使用する
 */
export type PayloadProduct = Omit<Product, "id" | "thumbnail_url">;

export function assertProduct(data: any): asserts data is Product {
    const d = data as Partial<Product>; // 補完のためキャスト
    if (
        !(
            typeof d?.id === "string" &&
            typeof d?.display_name === "string" &&
            typeof d?.span === "number"
        )
    ) {
        throw new Error("data is not User type");
    }
}