import {Order} from "../../modules/redux/order/types";
import {Button, Stack, Typography} from "@mui/material";
import StickyNote from "../StickyNote";
import IndexIcon from "./IndexIcon";
import {getOrderLabel} from "../../modules/util/orderUtils";
import React from "react";
import {Product} from "../../modules/redux/product/types";
import {Flex} from "../layout/Flex";
import {Row} from "../layout/Row";
import {MotionList, MotionListItem} from "../motion/motionList";

type ReceivedOrderListProps = {
    receivedOrders: Order[],
    products: Product[],
    /// 未受け取りにするを押したとき
    onClickUnreceive: (order: Order) => void
}

const ReceivedOrderList = (props: ReceivedOrderListProps) => {
    return <Stack spacing={3}>
        <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
            受取済み注文一覧
        </Typography>
        <MotionList layoutId={"received-order-list"}>
                {props.receivedOrders.map(order =>
                    <MotionListItem key={order.id}>
                        <StickyNote variant={"surface-variant"}>
                            <Flex>
                                <Row>
                                    <IndexIcon>
                                        {order.index}
                                    </IndexIcon>
                                    <Typography variant={"body2"}>
                                        {getOrderLabel(order, props.products)}
                                    </Typography>
                                </Row>
                                <Button variant={"outlined"} onClick={() => props.onClickUnreceive(order)}>
                                    未受取にする
                                </Button>
                            </Flex>
                        </StickyNote>
                    </MotionListItem>
                )}
        </MotionList>
    </Stack>
}

export default ReceivedOrderList;