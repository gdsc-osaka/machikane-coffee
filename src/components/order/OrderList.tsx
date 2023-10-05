import {Order} from "../../modules/redux/order/types";
import {Button, Chip, IconButton, Stack, Typography} from "@mui/material";
import {Product} from "../../modules/redux/product/types";
import {Flex} from "../layout/Flex";
import IndexIcon from "./IndexIcon";
import StickyNote from "../StickyNote";
import React from "react";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {AnimatePresence} from "framer-motion";
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

    return (
        <Stack spacing={3}>
            <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
                注文一覧
            </Typography>
            <MotionList layoutId={"order-list"}>
                <AnimatePresence>
                    {orders.map(order => {
                        return <MotionListItem key={order.id}>
                            <OrderItem order={order}
                                       products={products}
                                       onClickDelete={props.onClickDelete}
                                       onClickReceive={props.onClickReceive}/>
                        </MotionListItem>
                    })}
                </AnimatePresence>
            </MotionList>
        </Stack>
    );
}

const OrderItem = (props: {
    order: Order,
    products: Product[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void
}) => {
    const order = props.order;
    const isCompleted = order.status === "completed";
    const products = props.products;

    return <StickyNote>
        <Flex>
            <Stack direction={"row"} alignItems={"center"} spacing={1}>
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
            </Stack>
            <Stack direction={"row"} alignItems={"center"}>
                <Button variant={"contained"} disabled={!isCompleted} onClick={_ => props.onClickReceive(order)}>
                    受取
                </Button>
                <IconButton onClick={_ => props.onClickDelete(order)}>
                    <DeleteOutlineRoundedIcon/>
                </IconButton>
            </Stack>
        </Flex>
        {getSortedObjectKey(order.order_statuses).map(orderStatusId => {
            const orderStatus = order.order_statuses[orderStatusId];
            const product = products.find(prod => prod.id === orderStatus.product_id);
            const isCompleted = orderStatus.status === "completed";
            const isIdle = orderStatus.status === "idle";

            return <Flex style={{paddingLeft: "3rem"}}>
                <Typography variant={"body2"}>
                    {product?.shorter_name ?? ""}
                </Typography>
                <Chip label={isIdle ? "待機中" : isCompleted ? "完成済" : `${orderStatus.barista_id}番が担当中`}
                      color={isCompleted ? "primary" : "default"}/>
            </Flex>
        })}
    </StickyNote>;
}

export default OrderList;