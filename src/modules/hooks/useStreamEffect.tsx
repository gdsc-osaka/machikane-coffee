import React, {ReactNode, useContext, useEffect, useState} from "react";
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
type StreamState = {
    target: StreamTarget[];
    addTarget: (target: StreamTarget) => void;
}

const StreamContext = React.createContext<StreamState>({
    target: [],
    addTarget: () => []
});

export const StreamProvider = (props: {children: ReactNode}) => {
    const [streamTarget, setStreamTarget] = useState<StreamTarget[]>([]);

    return <StreamContext.Provider value={{
        target: streamTarget,
        addTarget: (target) => setStreamTarget(prev => [...prev, target])
    }}>
        {props.children}
    </StreamContext.Provider>
}

const streamFunctions = {
    order: streamOrders,
    product: streamProducts,
    stock: streamStocks,
    shop: streamShop,
}

/**
 * 指定されたデータをリアルタイム更新する.
 * @param shopId streamする対象の店ID
 * @param streamTo streamするもの. order, product, shop, stock のいずれか.
 */
export const useStreamEffect = (shopId: string, ...streamTo: StreamTarget[]) => {
    const dispatch = useAppDispatch();
    const streaming = useContext(StreamContext);

    useEffect(() => {
        console.log(streamTo)
        console.log(streaming)
        for (const target of streamTo) {
            if (!streaming.target.includes(target)) {
                streamFunctions[target](shopId, {dispatch});
                streaming.addTarget(target);
            }
        }
    }, [])
}