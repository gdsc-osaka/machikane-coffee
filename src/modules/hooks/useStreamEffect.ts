import {useEffect} from "react";
import {streamOrders} from "../redux/order/ordersThunk";
import {streamProducts} from "../redux/product/productsThunk";
import {streamStocks} from "../redux/stock/stocksThunk";
import {useAppDispatch, useAppSelector} from "../redux/store";
import {selectOrderStatus} from "../redux/order/orderSelectors";
import {selectProductStatus} from "../redux/product/productsSlice";
import {selectStockStatus} from "../redux/stock/stockSelectors";
import {selectShopStatus} from "../redux/shop/shopsSlice";
import {streamShop} from "../redux/shop/shopsThunk";

type StreamTarget = "order" | "product" | "shop" | "stock";

/**
 * 指定されたデータをリアルタイム更新する.
 * @param shopId streamする対象の店ID
 * @param streamTo streamするもの. order, product, shop, stock のいずれか.
 */
export function useStreamEffect(shopId: string, ...streamTo: StreamTarget[]) {
    const dispatch = useAppDispatch();

    // const orderStatus = useAppSelector(state => selectOrderStatus(state, shopId));
    // const productStatus = useAppSelector(state => selectProductStatus(state, shopId));
    // const stockStatus = useAppSelector(state => selectStockStatus(state, shopId));
    // const shopStatus = useAppSelector(state => selectShopStatus(state));

    useEffect(() => {
        console.log("start stream: " + streamTo.toString());

        let unsubOrder = () => {}, unsubProduct = () => {}, unsubStock = () => {}, unsubShop = () => {};

        if (streamTo.includes('order')) unsubOrder = streamOrders(shopId, {dispatch})
        if (streamTo.includes('product')) unsubProduct = streamProducts(shopId, {dispatch})
        if (streamTo.includes('stock')) unsubStock = streamStocks(shopId, {dispatch})
        if (streamTo.includes('shop')) unsubShop = streamShop(shopId, {dispatch})

        return () => {
            console.log("stop stream: " + streamTo.toString());
            unsubOrder();
            unsubProduct();
            unsubStock();
            unsubShop();
        }
    }, [])
}