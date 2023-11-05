import {Order} from "../../modules/redux/order/orderTypes";
import {Button, Divider, Pagination, Stack, Typography} from "@mui/material";
import StickyNote from "../StickyNote";
import React, {useState} from "react";
import {MotionList, MotionListItem} from "../motion/motionList";

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

const orderCountPerPage = 12;

const ReceivedOrderList = (props: {
    receivedOrders: Order[],
    onUnreceiveOrder: (order: Order) => void
}) => {
    const {receivedOrders, onUnreceiveOrder} = props;
    const [page, setPage] = useState(1);

    return <Stack alignItems={"center"} spacing={2}>
        <MotionList layoutId={"received-orders"}
                    style={{
                        display: 'grid', flexDirection: 'column', gap: '1rem', width: "100%",
                        gridTemplateColumns: '1fr '.repeat(2)
                    }}>
            {receivedOrders.slice(orderCountPerPage * (page - 1), orderCountPerPage * page).map(o =>
                <ReceivedOrderListItem order={o} key={o.id}
                                       onClickUnreceive={onUnreceiveOrder}/>
            )}
        </MotionList>
        <Pagination count={Math.ceil(receivedOrders.length / orderCountPerPage)}
                    page={page} onChange={(_, value) => setPage(value)}/>
    </Stack>
}
export default ReceivedOrderList;