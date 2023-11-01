import {Order} from "../redux/order/orderTypes";
import {Product} from "../redux/product/productTypes";

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
        if (labelStr.length != 0) {
            labelStr += " / "
        }

        const product = products.find(e => e.id == productId);
        const amount = order.product_amount[productId];

        if (product != undefined) {
            labelStr += `${product.shorter_name}×${amount}`;
        }
    }

    return labelStr;
}