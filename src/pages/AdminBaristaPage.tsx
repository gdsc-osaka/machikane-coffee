import {Box, Button, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {fetchShops, selectShopById, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {Shop} from "../modules/redux/shop/types";
import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import HourglassBottomRoundedIcon from '@mui/icons-material/HourglassBottomRounded';
import React from "react";
import styled from "styled-components";
import StickyNote from "../components/StickyNote";
import IndexIcon from "../components/order/IndexIcon";
import {fetchOrders, selectAllOrders, selectOrderStatus, updateOrder} from "../modules/redux/order/ordersSlice";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {getOrderLabel} from "../modules/util/orderUtils";
import {Order, Status} from "../modules/redux/order/types";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
`

const Flex = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  padding: 0.375rem 0.5rem;
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
    const [selectedIdIndex, setSelectedIdIndex] = useState(0);
    const [working, setWorking] = useState<OrderStatusId | undefined>();

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

    // データを取得
    useEffect(() => {
        if (shopStatus == "idle" || shopStatus == "failed") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);
    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(fetchOrders(shopId));
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
            const ids = Object.keys(shop.baristas).map((e) => parseInt(e));
            const firstInactiveId = ids.findIndex(id => shop.baristas[id] == "inactive") + 1;
            setSelectedIdIndex(firstInactiveId);
        }
    }, [shop])

    // それぞれのボタンを押したとき
    const changeOrderStatus = (order: Order, orderStatusId: string, type: Status) => {
        const newOrder: Order = {
            ...order,
            order_statuses: {
                ...order.order_statuses,
                [orderStatusId]: {
                    ...order.order_statuses[orderStatusId], status: type, barista_id: selectedIdIndex + 1
                }
            }
        }

        dispatch(updateOrder({shopId: shopId, newOrder: newOrder}));
        setWorking(type == "working" ? {orderId: order.id, orderStatusId: orderStatusId} : undefined);
    }

    if (shop == undefined) {
        return <div/>
    } else {
        return <Column>
            <ToggleButtonGroup color={"primary"} fullWidth={true} value={selectedIdIndex} exclusive>
                {baristaIds.map(id => <ToggleButton value={id} disabled={shop.baristas[id] == "active"}>{selectedIdIndex == id ? <CheckIcon style={{marginRight: "0.5rem"}}/> : <React.Fragment/>}{id}番</ToggleButton>)}
            </ToggleButtonGroup>
            <Typography variant={"body2"} textAlign={"right"} alignSelf={"stretch"}>
                担当を離れるときは選択を解除してください
            </Typography>
            <Typography variant={"h4"} fontWeight={"bold"}>
                注文一覧
            </Typography>
            {orders.map(order =>
                <StickyNote>
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
                                {isWorkingOnThis ? <Button variant={"outlined"} onClick={e => changeOrderStatus(order, orderStatusId, "idle")}>取り消し</Button> : <React.Fragment/>}
                                <Button variant={"contained"} disabled={isWorking && !isWorkingOnThis || isCompleted}
                                        onClick={e => changeOrderStatus(order, orderStatusId,
                                            isWorkingOnThis ? "completed" : "working")}>
                                    {isWorkingOnThis ? "完成" : isCompleted ?  "完成済" : isWorkingOnOther ? "他の商品を作成中です" : "つくる"}
                                </Button>
                            </Row>
                        </Flex>
                    })}
                </StickyNote>
            )}
        </Column>
    }
}

export default AdminBaristaPage