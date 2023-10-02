import {Order} from "../../modules/redux/order/types";
import {Button, Chip, IconButton, Stack, Typography, useTheme} from "@mui/material";
import {Product} from "../../modules/redux/product/types";
import {Column} from "../layout/Column";
import {Flex} from "../layout/Flex";
import IndexIcon from "./IndexIcon";
import StickyNote from "../StickyNote";
import React from "react";
import {Row} from "../layout/Row";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {AnimatePresence, motion} from "framer-motion";
import {MotionList, MotionListItem} from "../motion/motionList";
import {getSortedObjectKey} from "../../modules/util/objUtils";

type OrderListProps = {
    orders: Order[],
    products: Product[],
    onClickReceive: (order: Order) => void;
    onClickDelete: (order: Order) => void;
}

const OrderList = (props: OrderListProps) => {
    const orders = props.orders;
    const products = props.products;
    const theme = useTheme();

    return (
        <Stack spacing={3}>
            <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
                注文一覧
            </Typography>
            <MotionList layoutId={"order-list"}>
                <AnimatePresence>
                    {orders.map(order => {
                        const canReceive = Object.values(order.order_statuses).findIndex(orderStatus => orderStatus.status != "completed") == -1;

                        return <MotionListItem key={order.id}>
                            <StickyNote>
                                <Flex>
                                    <Row>
                                        <IndexIcon>
                                            {order.index}
                                        </IndexIcon>
                                        <Typography variant={"body1"}>
                                            {Intl.DateTimeFormat("ja-jp", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                            }).format(order.created_at.toDate())}
                                        </Typography>
                                    </Row>
                                    <Row gap={"0"}>
                                        <Button variant={"contained"} disabled={!canReceive} onClick={e => props.onClickReceive(order)}>
                                            受取
                                        </Button>
                                        <IconButton onClick={e => props.onClickDelete(order)}>
                                            <DeleteOutlineRoundedIcon/>
                                        </IconButton>
                                    </Row>
                                </Flex>
                                {getSortedObjectKey(order.order_statuses).map(orderStatusId => {
                                    const orderStatus = order.order_statuses[orderStatusId];
                                    const product = products.find(prod => prod.id == orderStatus.product_id);
                                    const isCompleted = orderStatus.status == "completed";
                                    const isIdle = orderStatus.status == "idle";

                                    return <Flex style={{paddingLeft: "3rem"}}>
                                        <Row>
                                            <Typography variant={"body2"}>
                                                {product?.shorter_name ?? ""}
                                            </Typography>
                                        </Row>
                                        <Chip label={isIdle ? "待機中" : isCompleted ? "完成済" : `${orderStatus.barista_id}番が担当中`} color={isCompleted ? "primary" : "default"}/>
                                    </Flex>
                                })}
                            </StickyNote>
                        </MotionListItem>
                    })}
                </AnimatePresence>
            </MotionList>
        </Stack>
    );
}

export default OrderList;