import {Order} from "./orderTypes";
import {Product} from "../product/productTypes";

export const isOrderCompleted = (order: Order, products: Product[]) => {
    for (const pid in order.product_amount) {
        const product = products.find(p => p.id === pid);

        if (product) {
            const moreThanStock = product.stock < order.product_amount[pid];

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