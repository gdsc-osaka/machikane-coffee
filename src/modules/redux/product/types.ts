/**
 * 商品情報
 * @property id 商品ID
 * @property display_name UIに表示する名前
 * @property span 提供にかかる時間、単位は秒
 */
export type Product = {
    id: string;
    display_name: string;
    span: number;
};

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