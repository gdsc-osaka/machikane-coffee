import {Order} from "../../modules/redux/order/orderTypes";
import {Product} from "../../modules/redux/product/productTypes";
import StickyNote from "../StickyNote";
import {Button, Divider, IconButton, Stack, Typography} from "@mui/material";
import {getOrderLabel} from "../../modules/util/orderUtils";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import React, {ReactNode, useMemo, useState} from "react";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";

export const UnreceivedOrderItem = (props: {
    order: Order,
    products: Product[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void,
    onReceiveIndividual: (order: Order, productStatusKey: string) => void,
}) => {
    const {order, products, onClickReceive, onClickDelete, onReceiveIndividual} = props;
    const [expanded, setExpanded] = useState(false);

    const canReceive = useMemo(() => {
        for (const prodId in order.product_amount) {
            const product = products.find(p => p.id === prodId);

            if (product === undefined) {
                return false;
            }

            const needAmount = order.product_amount[prodId];
            const stockAmount = product.stock;

            if (needAmount > stockAmount) {
                return false;
            }
        }

        return true;
    }, [order, products])

    const productStatusKeys = useMemo(() => Object.keys(order.product_status), [order])

    return <StickyNote direction={"row"}
                       sx={{alignItems: "stretch", justifyContent: "space-between", padding: "0.375rem 0.5rem"}}
                       spacing={1}>
        <Row>
            <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                {order.index}
            </Typography>
            <Divider orientation={"vertical"} sx={{height: "100%"}}/>
        </Row>
        <Stack direction={"column"} spacing={1} alignItems={"stretch"}>
            <Row sx={{justifyContent: 'space-between'}} spacing={2}>
                <Typography variant={"body2"}>
                    {getOrderLabel(order, products)}
                </Typography>
                <Row>
                    <Button variant={"outlined"} disabled={!canReceive} onClick={() => onClickReceive(order)}>
                        受取
                    </Button>
                    <IconButton onClick={() => setExpanded(!expanded)} disabled={productStatusKeys.length < 2}>
                        <ExpandMoreRoundedIcon/>
                    </IconButton>
                </Row>
            </Row>
            {expanded &&
                <>
                    {productStatusKeys.map(pStatusKey => {
                        const pStatus = order.product_status[pStatusKey];
                        const product = products.find(p => p.id === pStatus.productId);

                        return <Row sx={{justifyContent: 'space-between'}}>
                            <Typography variant={"body2"}>
                                {product?.shorter_name ?? '???'}
                            </Typography>
                            <Button variant={"text"} disabled={(product?.stock ?? 0) <= 0} onClick={() => onReceiveIndividual(order, pStatusKey)}>
                                個別受取
                            </Button>
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