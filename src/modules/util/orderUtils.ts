import {Order} from "../redux/order/types";
import {Product} from "../redux/product/types";

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