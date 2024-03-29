import {Order, ProductAmount} from "../redux/order/orderTypes";
import {Product} from "../redux/product/productTypes";
import {Stock} from "../redux/stock/stockTypes";

/**
 * 受け取り済みの商品を引いた注文の商品数を返す
 */
function getProductAmountLeft(order: Order) {
    const productAmountLeft = Object.assign({}, order.product_amount);

    for (const key in order.product_status) {
        const pPStatus = order.product_status[key];

        if (pPStatus.status === 'received') {
            productAmountLeft[pPStatus.product_id] -= 1;
        }
    }

    return productAmountLeft;
}

/**
 * 注文が完成済みかどうかを判定します. refer が required_product_amountの場合, その注文以前の注文が在庫を消費する想定で完成済みかどうかを判定します.
 * @param order
 * @param products
 * @param refer
 */
export const isOrderCompleted = (order: Order, products: Product[], refer: "required_product_amount" | "product_status" | "product_amount" = "product_amount") => {
    const productAmount = refer === 'product_status' ? getProductAmountLeft(order) : order[refer];

    for (const pid in productAmount) {
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

/**
 * 注文に紐づけられた在庫が完成済みかどうか
 */
export const isStocksOfOrderCompleted = (order: Order, stocks: Stock[]) => {
    return stocks
        .filter(s => s.orderRef.id === order.id && (s.status === 'idle' || s.status === 'working'))
        .length === 0;
}

export const sortByCompleted = (a: Order, b: Order, stocks: Stock[]) => {
    const aCompleted = isStocksOfOrderCompleted(a, stocks);
    const bCompleted = isStocksOfOrderCompleted(b, stocks);

    if (aCompleted && !bCompleted) return -1;

    if (!aCompleted && bCompleted) return 1;

    return 0;
}