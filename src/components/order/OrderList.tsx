// import {Order, Status} from "../../modules/redux/order/orderTypes";
// import {Button, Chip, IconButton, Stack, Typography, useTheme} from "@mui/material";
// import {Product} from "../../modules/redux/product/productTypes";
// import {Flex} from "../layout/Flex";
// import IndexIcon from "./IndexIcon";
// import StickyNote from "../StickyNote";
// import React, {useEffect, useState} from "react";
// import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
// import {MotionList, MotionListItem} from "../motion/motionList";
// import {getSortedObjectKey} from "../../modules/util/objUtils";
// import {getOrderLabel} from "../../modules/util/orderUtils";
// import {useCountDownInterval} from "../../modules/hooks/useCountDownInterval";
// import {isOrderCompleted} from "../../modules/redux/order/orderUtils";
//
// type OrderListProps = {
//     orders: Order[],
//     products: Product[],
//     onClickReceive: (order: Order) => void;
//     onClickDelete: (order: Order) => void;
//     onSwitchStatus: (order: Order, orderStatusId: string, status: Status) => void;
// }
//
// const OrderList = (props: OrderListProps) => {
//     const orders = props.orders;
//     const products = props.products;
//
//     return (
//         <Stack spacing={3}>
//             <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
//                 注文一覧
//             </Typography>
//             <MotionList layoutId={"order-list"}>
//                 {orders.map(order => {
//                     return <MotionListItem key={order.id}>
//                         <OrderItem order={order}
//                                    products={products}
//                                    onClickDelete={props.onClickDelete}
//                                    onClickReceive={props.onClickReceive}
//                                    onClickComplete={props.onSwitchStatus}/>
//                     </MotionListItem>
//                 })}
//             </MotionList>
//         </Stack>
//     );
// }
//
// const OrderItem = (props: {
//     order: Order,
//     products: Product[],
//     onClickDelete: (order: Order) => void,
//     onClickReceive: (order: Order) => void,
//     onClickComplete: (order: Order, orderStatusId: string, status: Status) => void,
// }) => {
//     const order = props.order;
//     const isCompleted = isOrderCompleted(order, products);
//     const products = props.products;
//     const theme = useTheme();
//
//     const [untilSec, setUntilSec] = useState(0);
//     useCountDownInterval(untilSec, setUntilSec);
//     const untilMin = Math.floor(untilSec / 60) % 60;
//
//     useEffect(() => {
//         const untilSec = Math.floor((order.complete_at.toDate().getTime() - new Date().getTime()) / 1000);
//         setUntilSec(untilSec)
//     }, [order])
//
//     const handleStatus = (orderStatusId: string, status: Status) => {
//         props.onClickComplete(order, orderStatusId, status);
//     }
//
//     return <StickyNote>
//         <Flex>
//             <Stack direction={"row"} alignItems={"center"} spacing={1}>
//                 <IndexIcon>
//                     {order.index}
//                 </IndexIcon>
//                 <Typography variant={"body1"}>
//                     {/*{Intl.DateTimeFormat("ja-jp", {*/}
//                     {/*    year: "numeric",*/}
//                     {/*    month: "2-digit",*/}
//                     {/*    day: "2-digit",*/}
//                     {/*    hour: "2-digit",*/}
//                     {/*    minute: "2-digit",*/}
//                     {/*    second: "2-digit",*/}
//                     {/*}).format(order.created_at.toDate())}*/}
//                     {getOrderLabel(order, products)}
//                 </Typography>
//                 {!isCompleted &&
//                     (untilSec > 0 ?
//                     <Typography variant={"caption"}>
//                         あと {('00' + untilMin.toString()).slice(-2)}:{('00' + (untilSec % 60).toString()).slice(-2)}
//                     </Typography>
//                     :
//                     <Typography variant={"caption"}>
//                         完成時刻を過ぎました
//                     </Typography>)
//                 }
//             </Stack>
//             <Stack direction={"row"} alignItems={"center"}>
//                 {isCompleted && <Chip label={"完成済み"}
//                                       color={"primary"}
//                                       style={{marginRight: theme.spacing(1)}}/>}
//                 <Button variant={"contained"} disabled={!isCompleted} onClick={_ => props.onClickReceive(order)}>
//                     受取
//                 </Button>
//                 <IconButton onClick={_ => props.onClickDelete(order)}>
//                     <DeleteOutlineRoundedIcon/>
//                 </IconButton>
//             </Stack>
//         </Flex>
//         {!isCompleted && getSortedObjectKey(order.order_statuses).map(orderStatusId => {
//             const orderStatus = order.order_statuses[orderStatusId];
//             const product = products.find(prod => prod.id === orderStatus.product_id);
//             const isCompleted = orderStatus.status === "completed";
//             const isIdle = orderStatus.status === "idle";
//
//             return <Stack direction={"row"} justifyContent={"space-between"} sx={{padding: "0.375rem 0.5rem", paddingLeft: "3rem"}}>
//                 <Typography variant={"body2"}>
//                     {product?.shorter_name ?? ""}
//                 </Typography>
//                 <Stack direction={"row"} spacing={1}>
//                     {!isCompleted ?
//                         <Button onClick={() => handleStatus(orderStatusId, "completed")}>
//                             完成にする
//                         </Button>
//                         :
//                         <Button onClick={() => handleStatus(orderStatusId, "idle")}>
//                             未完成にする
//                         </Button>
//                     }
//                     <Chip label={isIdle ? "待機中" : isCompleted ? "完成済" : `${orderStatus.barista_id}番が担当中`}
//                           color={isCompleted ? "primary" : "default"}/>
//                 </Stack>
//             </Stack>
//         })}
//     </StickyNote>;
// }
//
// export default OrderList;

export default "orderlist";