import {Order} from "../../modules/redux/order/orderTypes";
import {Button, Divider, Stack, Typography} from "@mui/material";
import StickyNote from "../StickyNote";
import React from "react";
import {MotionList, MotionListItem} from "../motion/motionList";
import Heading from "../Heading";
import useWindowSize from "../../modules/hooks/useWindowSize";

type ReceivedOrderListProps = {
    order: Order,
    /// 未受け取りにするを押したとき
    onClickUnreceive: (order: Order) => void
}

const ReceivedOrderListItem = (props: ReceivedOrderListProps) => {
    const {order, onClickUnreceive} = props;

    return <MotionListItem>
        <StickyNote direction={'row'}
                    sx={{alignItems: 'stretch', padding: "0.375rem 0.5rem"}}>
            <Stack direction={'row'} alignItems={"center"} spacing={0} justifyContent={"space-between"} width={"100%"}>
                <Stack direction={'row'} alignItems={"center"} spacing={1} height={"100%"}>
                    <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                        {order.index}
                    </Typography>
                    <Divider orientation={"vertical"} sx={{height: "100%"}}/>
                </Stack>
                <Button variant={"text"} onClick={() => onClickUnreceive(order)}>
                    未受取
                </Button>
            </Stack>
        </StickyNote>
    </MotionListItem>
};

const ReceivedOrderList = (props: {
    receivedOrders: Order[],
    onReceiveOrder: (order: Order) => void
}) => {
    const [width, _] = useWindowSize();

    return <>
        <MotionList layoutId={"received-orders"}
                    style={{
                        display: 'grid', flexDirection: 'column', gap: '1rem',
                        gridTemplateColumns: '1fr '.repeat(width > 1000 ? 3 : 2)
                    }}>
            {props.receivedOrders.map(o =>
                <ReceivedOrderListItem order={o} key={o.id}
                                       onClickUnreceive={props.onReceiveOrder}/>
            )}
        </MotionList>
    </>
}
export default ReceivedOrderList;