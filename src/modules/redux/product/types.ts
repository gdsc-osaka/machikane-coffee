export type Product = {
    id: string;
    display_name: string;
};

export function assertProduct(data: any): asserts data is Product {
    const d = data as Partial<Product>; // 補完のためキャスト
    if (
        !(
            typeof d?.id === "string" &&
            typeof d?.display_name === "string"
        )
    ) {
        throw new Error("data is not User type");
    }
}