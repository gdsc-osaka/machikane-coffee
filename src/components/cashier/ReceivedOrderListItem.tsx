import {Order} from "../../modules/redux/order/orderTypes";
import {Divider, IconButton, Stack, Typography} from "@mui/material";
import StickyNote from "../StickyNote";
import React from "react";
import UndoIcon from '@mui/icons-material/Undo';

type ReceivedOrderListProps = {
    order: Order,
    /// 未受け取りにするを押したとき
    onClickUnreceive: (order: Order) => void
}

const ReceivedOrderListItem = (props: ReceivedOrderListProps) => {
    const {order, onClickUnreceive} = props;

    return <StickyNote variant={"surface-variant"} direction={'row'}
                       sx={{alignItems: 'stretch', padding: "0.375rem 0.5rem"}}>
        <Stack direction={'row'} alignItems={"center"} spacing={1}>
            <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                {order.index}
            </Typography>
            <Divider orientation={"vertical"} sx={{height: "100%"}}/>
            <IconButton color={"primary"} onClick={() => onClickUnreceive(order)}>
                <UndoIcon/>
            </IconButton>
        </Stack>
    </StickyNote>
}

export default ReceivedOrderListItem;