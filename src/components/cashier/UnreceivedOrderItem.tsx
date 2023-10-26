import {Order} from "../../modules/redux/order/orderTypes";
import {Product} from "../../modules/redux/product/productTypes";
import StickyNote from "../StickyNote";
import {Button, Divider, IconButton, Stack, Typography} from "@mui/material";
import {getOrderLabel} from "../../modules/util/orderUtils";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import React from "react";

export const UnreceivedOrderItem = (props: {
    order: Order,
    products: Product[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void,
}) => {
    const {order, products, onClickReceive, onClickDelete} = props;

    return <StickyNote direction={"row"}
                       sx={{alignItems: "stretch", justifyContent: "space-between", padding: "0.375rem 0.5rem"}}
                       spacing={1}>
        <Stack direction={"row"} spacing={1} alignItems={"center"}>
            <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                {order.index}
            </Typography>
            <Divider orientation={"vertical"} sx={{height: "100%"}}/>
            <Typography variant={"body2"}>
                {getOrderLabel(order, products)}
            </Typography>
        </Stack>
        <Stack direction={"row"} spacing={1} alignItems={"center"}>
            <Button variant={"outlined"} onClick={() => onClickReceive(order)}>
                受取
            </Button>
            <IconButton>
                <ExpandMoreRoundedIcon/>
            </IconButton>
        </Stack>
    </StickyNote>
}