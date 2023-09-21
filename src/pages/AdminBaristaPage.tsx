import {Box, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
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
import {fetchOrders, selectAllOrders, selectOrderStatus} from "../modules/redux/order/ordersSlice";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {getOrderLabel} from "../modules/util/orderUtils";

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

const AdminBaristaPage = () => {
    const [selectedId, setSelectedId] = useState(0);
    const [baristaIds, setBaristaIds] = useState<number[]>([]);

    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const shopStatus = useSelector(selectShopStatus);
    const shop = useSelector<RootState, Shop | undefined>(state => selectShopById(state, shopId));
    const orderStatus = useSelector(selectOrderStatus);
    const orders = useSelector(selectAllOrders);
    const productStatus = useSelector(selectProductStatus);
    const products = useSelector(selectAllProduct);

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
            setBaristaIds(ids);
            const firstInactiveId = ids.findIndex(id => shop.baristas[id] == "inactive") + 1;
            setSelectedId(firstInactiveId);
        }
    }, [shop])

    if (shop == undefined) {
        return <div/>
    } else {
        return <Column>
            <ToggleButtonGroup color={"primary"} fullWidth={true} value={selectedId} exclusive>
                {baristaIds.map(id => <ToggleButton value={id} disabled={shop.baristas[id] == "active"}>{selectedId == id ? <CheckIcon style={{marginRight: "0.5rem"}}/> : <React.Fragment/>}{id}番</ToggleButton>)}
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
                    {Object.keys(order.order_statuses).map(statusKey => {
                        const orderStatus = order.order_statuses[statusKey];
                        const product = products.find(prod => prod.id == orderStatus.product_id);

                        return <Flex>
                            <Row>
                                {orderStatus.status == "idle" ? <HourglassEmptyRoundedIcon/> : <React.Fragment/>}
                                {orderStatus.status == "working" ? <HourglassBottomRoundedIcon/> : <React.Fragment/>}
                                {orderStatus.status == "completed" ? <CheckIcon/> : <React.Fragment/>}
                                <Typography variant={"body2"}>
                                    {product?.shorter_name ?? ""}
                                </Typography>
                            </Row>
                            <Row>

                            </Row>
                        </Flex>
                    })}
                </StickyNote>
            )}
        </Column>
    }
}

export default AdminBaristaPage