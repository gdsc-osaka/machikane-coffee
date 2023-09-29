import {Button, CircularProgress, Stack, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {
    selectShopById,
    selectShopStatus,
    selectShopUnsubscribe, streamShop,
    updateShop
} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {BaristaMap, RawShop, Shop} from "../modules/redux/shop/types";
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import React from "react";
import styled from "styled-components";
import StickyNote from "../components/StickyNote";
import IndexIcon from "../components/order/IndexIcon";
import {
    selectAllOrders,
    selectOrderStatus, selectOrderUnsubscribe,
    streamOrders,
    updateOrder
} from "../modules/redux/order/ordersSlice";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {getOrderLabel} from "../modules/util/orderUtils";
import {Order, Status} from "../modules/redux/order/types";
import {Flex} from "../components/layout/Flex";
import * as stream from "stream";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  gap: 0.375rem;
`

/**
 * Order.orderedStatusesの要素を識別する
 * @property orderId OrderのドキュメントID
 * @property orderStatusId ProductのID
 */
type OrderStatusId = {
    orderId: string;
    orderStatusId: string;
}

const AdminBaristaPage = () => {
    const [selectedId, setSelectedId] = useState(0);
    const [working, setWorking] = useState<OrderStatusId | undefined>();
    const [baristas, setBaristas] = useState<BaristaMap>({});

    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const shopStatus = useSelector(selectShopStatus);
    const shop = useSelector<RootState, Shop | undefined>(state => selectShopById(state, shopId));
    const orderStatus = useSelector(selectOrderStatus);
    const orders = useSelector(selectAllOrders);
    const productStatus = useSelector(selectProductStatus);
    const products = useSelector(selectAllProduct);
    const isWorking = working != undefined;
    const baristaIds = shop == undefined ? [] : Object.keys(shop.baristas).map((e) => parseInt(e));

    const shopUnsubscribe = useSelector(selectShopUnsubscribe);
    const orderUnsubscribe = useSelector(selectOrderUnsubscribe);

    // データを取得
    useEffect(() => {
        if (shopStatus == "idle" || shopStatus == "failed") {
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus]);
    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(streamOrders(shopId));
        }
    }, [dispatch, orderStatus]);
    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    // shopが取得された後にbaristaIdとselectedIdを初期化
    useEffect(() => {
        if (shop != undefined) {
            setBaristas(shop.baristas);
        }
    }, [shop])

    // windowが閉じられたとき or refreshされたとき, selectedIdをinactiveに戻す & unsubscribe
    useEffect(() => {
        window.addEventListener("beforeunload", (e) => {
            // ISSUE#21
            // if (shop != undefined) {
            //     console.log("updateshop")
            //     dispatch(updateShop({shopId, rawShop: {...shop, baristas: {...shop.baristas, [selectedId]: "inactive"}}}));
            // }

            if (shopUnsubscribe != null) {
                shopUnsubscribe();
            }

            if (orderUnsubscribe != null) {
                orderUnsubscribe();
            }
        })
    }, [])

    // バリスタIDの変更
    const handleBaristaId = (
        newId: number | null | undefined
    ) => {
        const oldId = selectedId;

        if (shop != undefined && oldId != newId) {
            let newBaristas: BaristaMap;

            if (newId != null) {
                // idを最初に設定したときはoldIdが0なので場合分けする
                newBaristas = oldId > 0 ? {...shop.baristas, [newId]: "active", [oldId]: "inactive"} : {...shop.baristas, [newId]: "active"};
                setSelectedId(newId);
            } else {
                // 選択中のボタンを押したとき
                newBaristas = {...shop.baristas, [oldId]: "inactive"};
                setSelectedId(0);
            }

            const rawShop: RawShop = {...shop, baristas: newBaristas};
            dispatch(updateShop({shopId, rawShop}));
            setBaristas(newBaristas);
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
        setWorking(type == "working" ? {orderId: order.id, orderStatusId: orderStatusId} : undefined);
    }

    if (shop == undefined) {
        return <CircularProgress/>
    } else {
        return <Stack spacing={2} sx={{padding: "25px 10px"}}>
            <Stack spacing={1}>
                <ToggleButtonGroup color={"primary"} fullWidth={true} value={selectedId} exclusive onChange={(e, id) => handleBaristaId(id)}>
                    {baristaIds.map(id =>
                        <ToggleButton value={id} disabled={baristas[id] == "active" && selectedId != id}>
                            {selectedId == id ? <CheckIcon style={{marginRight: "0.5rem"}}/> : <React.Fragment/>}
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
            {orders.map(order => {
                // 全て完了した場合
                if (Object.values(order.order_statuses).findIndex(orderStatus => orderStatus.status != "completed") == -1) {
                    return <React.Fragment/>
                }

                return <StickyNote>
                    <Flex>
                        <Row>
                            <IndexIcon>
                                {order.index}
                            </IndexIcon>
                            <Typography variant={"body2"}>
                                {getOrderLabel(order, products)}
                            </Typography>
                        </Row>
                    </Flex>
                    {Object.keys(order.order_statuses).map(orderStatusId => {
                        const orderStatus = order.order_statuses[orderStatusId];
                        const product = products.find(prod => prod.id == orderStatus.product_id);
                        const isWorkingOnThis = working != undefined && working.orderId == order.id && working.orderStatusId == orderStatusId;
                        const isWorkingOnOther = isWorking && !isWorkingOnThis;
                        const isCompleted = orderStatus.status == "completed";

                        return <Flex style={{paddingLeft: "2.5rem"}}>
                            <Row>
                                {orderStatus.status == "idle" ? <HourglassEmptyRoundedIcon/> : <React.Fragment/>}
                                {orderStatus.status == "working" ? <HourglassBottomRoundedIcon/> : <React.Fragment/>}
                                {orderStatus.status == "completed" ? <CheckIcon/> : <React.Fragment/>}
                                <Typography variant={"body2"}>
                                    {product?.shorter_name ?? ""}
                                </Typography>
                            </Row>
                            <Row>
                                {isWorkingOnThis ? <Button variant={"outlined"} onClick={e => handleOrderStatus(order, orderStatusId, "idle")}>取り消し</Button> : <React.Fragment/>}
                                <Button variant={"contained"} disabled={isWorking && !isWorkingOnThis || isCompleted || selectedId == 0}
                                        onClick={e => handleOrderStatus(order, orderStatusId,
                                            isWorkingOnThis ? "completed" : "working")}>
                                    {isWorkingOnThis ? "完成" : isCompleted ?  "完成済" : isWorkingOnOther ? "他の商品を作成中です" : "つくる"}
                                </Button>
                            </Row>
                        </Flex>
                    })}
                </StickyNote>
                }
            )}
        </Stack>
    }
}

export default AdminBaristaPage