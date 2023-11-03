import {Order} from "../../modules/redux/order/orderTypes";
import {Product} from "../../modules/redux/product/productTypes";
import StickyNote from "../StickyNote";
import {Button, Divider, IconButton, Stack, Typography} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import React, {ReactNode, useMemo, useState} from "react";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import {getOrderLabel, isStocksOfOrderCompleted} from "../../modules/util/orderUtils";
import {Stock} from "../../modules/redux/stock/stockTypes";

export const UnreceivedOrderItem = (props: {
    order: Order,
    products: Product[],
    stocks: Stock[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void,
    onClickComplete: (order: Order, productStatusKey: string) => void,
    onClickAllComplete: (order: Order) => void,
    onReceiveIndividual: (order: Order, productStatusKey: string) => void,
}) => {
    const {order, products, stocks, onClickReceive, onClickDelete, onClickComplete, onClickAllComplete, onReceiveIndividual} = props;
    const [expanded, setExpanded] = useState(false);

    const canReceive = useMemo(() => {
        for (const prodId in order.product_amount) {
            const product = products.find(p => p.id === prodId);

            if (product !== undefined) {
                const needAmount = Object.values(order.product_status)
                    .filter(s => s.status !== "received" && s.product_id === prodId).length;
                const stockAmount = product.stock;

                if (needAmount > stockAmount) {
                    return false;
                }
            }
        }

        return true;
    }, [order, products]);

    const stocksBuffer = stocks.slice();

    const productStatusKeys = useMemo(() => {
        return Object.keys(order.product_status).sort((a, b) => a > b ? 1 : -1);
    }, [order])

    const isOneItem = productStatusKeys.length < 2;
    const productStatus = order.product_status[productStatusKeys[0]];

    const isCompleted = isStocksOfOrderCompleted(order, stocks);

    return <StickyNote direction={"row"} variant={isCompleted ? 'surface-variant' : 'surface'}
                       sx={{alignItems: "stretch", padding: "0.375rem 0.5rem"}}
                       spacing={1}>
        <Row key={`unreceived-order-item-${order.id}-1`}>
            <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                {order.index}
            </Typography>
            <Divider orientation={"vertical"} sx={{height: "100%"}}/>
        </Row>
        <Stack direction={"column"} spacing={1} alignItems={"stretch"} width={"100%"}>
            <Row sx={{justifyContent: 'space-between'}} spacing={2} key={`unreceived-order-item-${order.id}-2`}>
                <Typography variant={"body2"} sx={{    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: "2",
                    WebkitBoxOrient: "vertical",}}>
                    {getOrderLabel(order, products)}
                </Typography>
                <Row key={`unreceived-order-item-${order.id}-3`} spacing={0}>
                    <Button disabled={isCompleted}
                            onClick={() => onClickAllComplete(order)}>
                        {isCompleted ? "完成済" : "完成"}
                    </Button>
                    <Button variant={"outlined"} disabled={!canReceive} onClick={() => onClickReceive(order)}>
                        {canReceive ? "受取" : "在庫不足"}
                    </Button>
                    <IconButton onClick={() => onClickDelete(order)}>
                        <DeleteRoundedIcon/>
                    </IconButton>
                    <IconButton onClick={() => setExpanded(!expanded)} disabled={isOneItem}>
                        <ExpandMoreRoundedIcon/>
                    </IconButton>
                </Row>
            </Row>
            {expanded &&
                <>
                    {productStatusKeys.map(pStatusKey => {
                        const pStatus = order.product_status[pStatusKey];
                        const product = products.find(p => p.id === pStatus.product_id);
                        const isReceived = pStatus.status === 'received'
                        const noStock = (product?.stock ?? 0) <= 0;
                        const stock = stocksBuffer.find(s => s.orderRef.id === order.id
                            && s.product_id === productStatus.product_id);

                        if (stock)
                            stocksBuffer.remove(s => s.id === stock.id)

                        return <Row sx={{justifyContent: 'space-between'}} key={`unreceived-order-item-${order.id}-${pStatusKey}`}>
                            <Typography variant={"body2"}>
                                {product?.shorter_name ?? '???'}
                            </Typography>
                            <Row>
                                <Button disabled={stock === undefined || stock.status === 'completed' || stock.status === 'received'}
                                        onClick={() => onClickComplete(order, pStatusKey)}>
                                    {stock?.status === 'completed' ? "完成済み" : stock?.status === 'received' ? "受取済" : "完成"}
                                </Button>
                                <Button variant={"outlined"} disabled={noStock || isReceived} onClick={() => onReceiveIndividual(order, pStatusKey)}>
                                    {isReceived ? "受取済み" : noStock ? "在庫不足" : "個別受取"}
                                </Button>
                            </Row>
                        </Row>
                    })}
                </>
            }
        </Stack>
    </StickyNote>
}

const Row = (props: {children: ReactNode, sx?: SxProps<Theme>, spacing?: number}) => {
    return <Stack direction={"row"} spacing={props.spacing ?? 1} alignItems={"center"}
                  sx={{justifyContent: 'flex-start', ...props.sx}}>
        {props.children}
    </Stack>
}