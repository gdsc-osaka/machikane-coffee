import {Order, ProductAmount} from "../redux/order/orderTypes";
import {Product} from "../redux/product/productTypes";
import {Stock} from "../redux/stock/stockTypes";

/**
 * 注文が完成済みかどうかを判定します. refer が required_product_amountの場合, その注文以前の注文が在庫を消費する想定で完成済みかどうかを判定します.
 * @param order
 * @param products
 * @param refer
 */
export const isOrderCompleted = (order: Order, products: Product[], refer: "required_product_amount" | "product_amount" = "product_amount") => {
    for (const pid in order[refer]) {
        const product = products.find(p => p.id === pid);

        if (product) {
            const moreThanStock = product.stock < order[refer][pid];

            if (moreThanStock) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Orderの商品が全て受け取られたかどうか
 * @param order
 */
export const isOrderAllReceived = (order: Order) => Object.values(order.product_status).find(s => s.status === 'idle') === undefined;

export const getOrderLabel = (order: Order, products: Product[]) => {
    let labelStr = "";

    for (const productId in order.product_amount) {
        if (labelStr.length !== 0) {
            labelStr += " / "
        }

        const product = products.find(e => e.id === productId);
        const amount = order.product_amount[productId];

        if (product !== undefined) {
            labelStr += `${product.shorter_name}×${amount}`;
        }
    }

    return labelStr;
}

/**
 * 注文の作成時間を計算する
 * averageSpan = Σproduct.span * amountOfProduct / allAmount
 * return ceil(allAmount / baristaAmount) * averageSpan
 * @param productAmount order.product_amountのこと
 * @param products
 * @param baristaCount バリスタ人数
 */
export const getTimeToMake = (productAmount: ProductAmount, products: Product[], baristaCount: number) => {
    let sumSpan = 0;
    let allAmount = 0;

    for (const productId in productAmount) {
        const product = products.find(p => p.id === productId);

        if (product) {
            const amount = productAmount[productId];
            sumSpan += product.span * amount;
            allAmount += amount;

        } else {
            console.error(`Product:${productId} not found.`)
        }
    }

    const averageSpan = sumSpan / allAmount;

    return Math.ceil(allAmount / baristaCount) * averageSpan;
}

export const sortByCompleted = (a: Order, b: Order, stocks: Stock[]) => {
    const aStock = stocks.find(s => s.orderRef.id === a.id);
    const bStock = stocks.find(s => s.orderRef.id === b.id);

    if (!aStock || !bStock) return 0;

    const aCompleted = aStock.status === 'completed';
    const bCompleted = bStock.status === 'completed';

    if (aCompleted && !bCompleted) return -1;

    if (!aCompleted && bCompleted) return 1;

    return 0;
}