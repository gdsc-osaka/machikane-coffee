import {Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {
    selectShopById,
    selectShopStatus,
    selectShopUnsubscribe,
    streamShop,
    updateShop
} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {BaristaMap, RawShop, Shop} from "../modules/redux/shop/types";
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import StickyNote from "../components/StickyNote";
import IndexIcon from "../components/order/IndexIcon";
import {
    selectAllOrdersInverse,
    selectOrderStatus,
    selectOrderUnsubscribe,
    streamOrders,
    updateOrder
} from "../modules/redux/order/ordersSlice";
import {fetchProducts, selectAllProduct} from "../modules/redux/product/productsSlice";
import {getOrderLabel} from "../modules/util/orderUtils";
import {Order, Status} from "../modules/redux/order/types";
import {Flex} from "../components/layout/Flex";
import {MotionList, MotionListItem} from "src/components/motion/motionList";
import {getSortedObjectKey} from "../modules/util/objUtils";
import {Product} from "../modules/redux/product/types";
import {useAuth} from "../AuthGuard";
import toast from "react-hot-toast";

/**
 * Order.orderedStatusesの要素を識別する
 * @property orderId OrderのドキュメントID
 * @property orderStatusKey ProductのID
 */
type OrderStatusId = {
    orderId: string;
    orderStatusKey: string;
}

function isSameOrderStatusId(a: OrderStatusId, b: OrderStatusId) {
    return a.orderId === b.orderId && a.orderStatusKey === b.orderStatusKey;
}

const AdminBaristaPage = () => {
    const [selectedId, setSelectedId] = useState(0);
    const [workingOrderStatusIds, setWorkingOrderStatusIds] = useState<OrderStatusId[]>([]);

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const params = useParams();

    const shopId = params.shopId ?? '';
    const shopStatus = useSelector(selectShopStatus);
    const shop = useSelector<RootState, Shop | undefined>(state => selectShopById(state, shopId));
    const baristas = shop?.baristas ?? {};
    const baristaIds = shop === undefined ? [] : Object.keys(shop.baristas).map((e) => parseInt(e));

    const orderStatus = useSelector(selectOrderStatus);
    const orders = useSelector(selectAllOrdersInverse);
    const products = useSelector(selectAllProduct);

    const shopUnsubscribe = useSelector(selectShopUnsubscribe);
    const orderUnsubscribe = useSelector(selectOrderUnsubscribe);

    // データを取得
    useEffect(() => {
        if (shopStatus === "idle" || shopStatus === "failed") {
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus, shopId]);

    useEffect(() => {
        if (orderStatus === "idle" || orderStatus === "failed") {
            dispatch(streamOrders(shopId));
        }
    }, [dispatch, orderStatus, shopId]);

    useEffect(() => {
        dispatch(fetchProducts(shopId));
    }, []);

    // windowが閉じられたとき or refreshされたとき, selectedIdをinactiveに戻す & unsubscribe
    useEffect(() => {
        window.addEventListener("beforeunload", (_) => {
            // ISSUE#21
            // if (shop !== undefined) {
            //     console.log("updateshop")
            //     dispatch(updateShop({shopId, rawShop: {...shop, baristas: {...shop.baristas, [selectedId]: "inactive"}}}));
            // }

            if (shopUnsubscribe !== null) {
                shopUnsubscribe();
            }

            if (orderUnsubscribe !== null) {
                orderUnsubscribe();
            }
        })
    }, [shopUnsubscribe, orderUnsubscribe])

    // バリスタIDの変更
    const handleBaristaId = (
        newId: number | null | undefined
    ) => {
        const oldId = selectedId;

        if (newId !== null && newId !== undefined &&
            baristas[newId] === "active" && selectedId !== newId) {
            toast(`${newId}番は他に担当者がいます`, {
                icon: '\u26A0'
            });
        }

        if (shop !== undefined && oldId !== newId) {
            let newBaristas: BaristaMap;

            if (newId !== null && newId !== undefined) {
                // idを最初に設定したときはoldIdが0なので場合分けする
                newBaristas = oldId > 0 ? {
                    ...shop.baristas,
                    [newId]: "active",
                    [oldId]: "inactive"
                } : {...shop.baristas, [newId]: "active"};
                setSelectedId(newId);
            } else {
                // 選択中のボタンを押したとき
                newBaristas = {...shop.baristas, [oldId]: "inactive"};
                setSelectedId(0);
            }

            const rawShop: RawShop = {...shop, baristas: newBaristas};
            dispatch(updateShop({shopId, rawShop}));
        }
    };

    // それぞれのボタンを押したとき
    const handleOrderStatus = (order: Order, orderStatusId: string, type: Status) => {
        const newOrder: Order = {
            ...order,
            order_statuses: {
                ...order.order_statuses,
                [orderStatusId]: {
                    ...order.order_statuses[orderStatusId], status: type, barista_id: selectedId
                }
            }
        }

        dispatch(updateOrder({shopId, newOrder}));

        const orderStatus = {orderId: order.id, orderStatusKey: orderStatusId};

        if (type === "working") {
            setWorkingOrderStatusIds([...workingOrderStatusIds, orderStatus]);
        } else {
            setWorkingOrderStatusIds(workingOrderStatusIds.concat().remove(e => isSameOrderStatusId(e, orderStatus)))
        }
    }


    if (shop == undefined || auth.loading) {
        return <CircularProgress/>
    } else {
        return <Stack spacing={2} sx={{padding: "25px 10px"}}>
            <Stack spacing={1}>
                <ToggleButtonGroup color={"primary"} fullWidth={true} value={selectedId} exclusive
                                   onChange={(e, id) => handleBaristaId(id)}>
                    {baristaIds.map(id =>
                        // TODO disabled条件を付けるか否か? <ToggleButton value={id} disabled={baristas[id] === "active" && selectedId !== id}>
                        <ToggleButton value={id}>
                            {selectedId === id ? <CheckIcon style={{marginRight: "0.5rem"}}/> : <React.Fragment/>}
                            {id}番
                        </ToggleButton>)}
                </ToggleButtonGroup>
                <Typography variant={"body2"} textAlign={"right"} alignSelf={"stretch"}>
                    担当を離れるときは選択を解除してください
                </Typography>
            </Stack>
            <Typography variant={"h4"} fontWeight={"bold"} sx={{padding: "5px 0"}}>
                未完成の注文一覧
            </Typography>
            <MotionList layoutId={"barista-order-list"}>
                {orders.map(order => {
                    // 全て完了した場合
                    if (Object.values(order.order_statuses).findIndex(orderStatus => orderStatus.status !== "completed") === -1) {
                        return <React.Fragment/>
                    }

                    return <MotionListItem key={order.id}>
                        <BaristaOrderItem order={order}
                                          products={products}
                                          orderStatusIds={workingOrderStatusIds}
                                          selectedId={selectedId}
                                          handleOrderStatus={handleOrderStatus}/>
                    </MotionListItem>
                })}
            </MotionList>
        </Stack>
    }
}

const BaristaOrderItem = (props: {
    order: Order,
    products: Product[],
    orderStatusIds: OrderStatusId[],
    selectedId: number,
    handleOrderStatus: (order: Order, orderStatusId: string, type: Status) => void,
}) => {
    const {order, products, orderStatusIds, handleOrderStatus, selectedId} = props;

    const isWorking = orderStatusIds.length > 0;

    return <StickyNote>
        <Flex>
            <Stack direction={"row"} alignItems={"center"} spacing={1}>
                <IndexIcon>
                    {order.index}
                </IndexIcon>
                <Typography variant={"body2"}>
                    {getOrderLabel(order, products)}
                </Typography>
            </Stack>
        </Flex>
        {getSortedObjectKey(order.order_statuses).map(orderStatusId => {
            const orderStatus = order.order_statuses[orderStatusId];
            const product = products.find(prod => prod.id === orderStatus.product_id);
            const isOrderStatusExists = orderStatusIds.findIndex(os => isSameOrderStatusId(os, {
                orderId: order.id,
                orderStatusKey: orderStatusId
            })) !== -1;
            const isWorkingOnThis = isWorking && isOrderStatusExists;
            const isCompleted = orderStatus.status === "completed";
            const disabled = isCompleted || selectedId === 0 || (orderStatus.status === "working" && orderStatus.barista_id !== selectedId);

            return <Flex style={{paddingLeft: "2.5rem"}}>
                <Stack direction={"row"} alignItems={"center"} spacing={1}>
                    {orderStatus.status === "idle" ? <HourglassEmptyRoundedIcon/> : <React.Fragment/>}
                    {orderStatus.status === "working" ? <HourglassBottomRoundedIcon/> : <React.Fragment/>}
                    {orderStatus.status === "completed" ? <CheckIcon/> : <React.Fragment/>}
                    <Typography variant={"body2"}>
                        {product?.shorter_name ?? ""}
                    </Typography>
                </Stack>
                <Stack direction={"row"} alignItems={"center"} spacing={1}>
                    {isWorkingOnThis &&
                        <Button variant={"outlined"}
                                disabled={disabled}
                                onClick={_ => handleOrderStatus(order, orderStatusId, "idle")}>
                            取り消し
                        </Button>
                    }
                    <Button variant={"contained"}
                            disabled={disabled}
                            onClick={_ => handleOrderStatus(order, orderStatusId,
                                isWorkingOnThis ? "completed" : "working")}>
                        {isWorkingOnThis ? "完成" :
                            isCompleted ? "完成済" :
                                orderStatus.status === "working" ? `${orderStatus.barista_id}番が作成中です` : "つくる"}
                    </Button>
                </Stack>
            </Flex>
        })}
    </StickyNote>;
}

export default AdminBaristaPage