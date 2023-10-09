import {Button, Dialog, DialogActions, DialogTitle, Divider, Stack, TextField, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {
    selectAllOrders, selectOrderById,
    selectOrderByIndex,
    selectOrderUnsubscribe,
    streamOrder
} from "../modules/redux/order/ordersSlice";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {Order} from "../modules/redux/order/types";
import StickyNote from "../components/StickyNote";
import {Product} from "../modules/redux/product/types";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {M3Switch} from "../components/M3Switch";
import {useCountDownInterval} from "../modules/hooks/useCountDownInterval";

const OrderPage = () => {
    const [orderIndex, setOrderIndex] = useState<string>("");
    const [orderId, setOrderId] = useState("");
    const [openDialog, setOpenDialog] = useState(false);

    const dispatch = useAppDispatch();
    const navi = useNavigate();
    const location = useLocation();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const paramOrderIndex = params.orderIndex ?? '';
    const order = useSelector((state: RootState) => selectOrderById(state, orderId));
    const unsubscribe = useSelector(selectOrderUnsubscribe);

    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    useEffect(() => {
        const oIndex = Number(paramOrderIndex);

        if (!isNaN(oIndex) && oIndex != 0) {
            const strOIndex = oIndex.toString();
            setOrderIndex(strOIndex);
            handleSubmit(strOIndex);
        }
    }, [paramOrderIndex])

    const handleOrderIndex = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const num = Number(e.target.value);
        if (!isNaN(num) && num != 0) {
            setOrderIndex(num.toString());

        } else if (e.target.value == "") {
            setOrderIndex("");
        }
    }

    const handleSubmit = async (orderIndex: string) => {
        if (unsubscribe != null) {
            unsubscribe();
        }

        const num = Number(orderIndex);

        if (!isNaN(num)) {
            await dispatch(streamOrder({shopId: shopId, orderIndex: num}))
                .unwrap()
                .then((payload) => {
                    setOrderId(payload.order.id);

                    if (location.pathname.endsWith("order") || location.pathname.endsWith("order/")) {
                        navi(`${orderIndex}`);
                    } else {
                        navi(`/${shopId}/order/${orderIndex}`)
                    }
                })
                .catch((e) => {
                    setOpenDialog(true);
                });

        }
    }

    const handleClose = () => {
        setOpenDialog(false);
    }

    return <Stack spacing={2} padding={"1rem"}>
        <Typography variant={"h4"}>
            注文照会
        </Typography>
        <Stack direction={"row"} spacing={1}>
            <TextField id={"order-index"} variant={"filled"}
                       label={"注文番号"} // helperText={"番号札に記入された数字を入力してください"}
                       type={"number"} required
                       value={orderIndex} onChange={handleOrderIndex} sx={{minWidth: "17rem"}}/>
            <Button variant={"contained"} sx={{width: "100%"}}
                    disabled={orderIndex == undefined} onClick={() => handleSubmit(orderIndex)}>
                確認
            </Button>
        </Stack>
        {order !== undefined && <OrderCard order={order} products={products}/>}
        <Dialog open={openDialog} onClose={handleClose}>
            <DialogTitle>
                該当する番号の注文が見つかりません
            </DialogTitle>
            <DialogActions>
                <Button onClick={handleClose}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    </Stack>
}

const OrderCard = (props: {order: Order, products: Product[]}) => {
    const [untilCount, setUntilCount] = useState(0);

    const order = props.order;
    const untilTime = order.complete_at.toDate().getTime() - new Date().getTime();
    const until = new Date(untilTime);
    const untilMin = Math.floor(untilCount / 60);
    const untilSec = untilCount - (untilMin * 60);
    const completeRate = untilTime / (order.complete_at.toDate().getTime() - order.created_at.toDate().getTime());
    const products = props.products;
    const productTexts = Object.keys(order.product_amount).map(key => `${products.find(e => e.id == key)?.display_name ?? '???'} × ${order.product_amount[key]}`);

    useEffect(() => {
        setUntilCount(Math.floor(until.getTime() / 1000));
    }, [until]);

    useCountDownInterval(untilCount, setUntilCount);

    return <StickyNote>
        <Stack spacing={3} sx={{width: "100%", padding: "1rem 1.5rem"}}>
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Stack spacing={1}>
                    <Typography variant={"caption"}>
                        完成予定まで
                    </Typography>
                    {untilCount > 0 ?
                        <Stack direction={"row"} spacing={0.7} alignItems={"flex-end"}>
                            {untilMin > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}}>
                                        {untilMin}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}>
                                        分
                                    </Typography>
                                </React.Fragment>}
                            {untilSec > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{paddingLeft: "0.2rem", fontWeight: "bold"}}>
                                        {untilSec}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}>
                                        秒
                                    </Typography>
                                </React.Fragment>}
                        </Stack>
                        :
                        <Typography sx={{fontWeight: "bold"}}>
                            まもなく完成します･･･
                        </Typography>
                    }
                </Stack>
                <Stack spacing={1}>
                    <Typography variant={"caption"}>
                        注文番号
                    </Typography>
                    <Typography variant={"h3"} textAlign={"right"} fontWeight={"bold"}>
                        {order.index}
                    </Typography>
                </Stack>
            </Stack>
            <div style={{marginLeft: "-1rem", marginRight: "-1rem"}}>
                <Divider sx={{borderBottomStyle: "dotted"}}/>
            </div>
            {/*見出しとTypographyの間隔が、通知設定の物と合わないので仕方なくこの書き方*/}
            <Stack spacing={productTexts.length == 1 ? 0 : 1}>
                <Typography variant={"caption"}>
                    商品
                </Typography>
                <Stack sx={{minHeight: "38px"}} justifyContent={"center"} spacing={1}>
                    {productTexts.map(p => <Typography variant={"body1"}>
                        {p}
                    </Typography>)}
                </Stack>
            </Stack>
            <Stack>
                <Typography variant={"caption"}>
                    通知設定
                </Typography>
                <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}
                       sx={{height: "38px"}}>
                    <Typography variant={"body1"}>
                        商品完成時に通知を受け取る
                    </Typography>
                    <M3Switch/>
                </Stack>
            </Stack>
        </Stack>
        <Stack alignItems={"end"}>
            <Divider sx={{borderColor: "#D5C3B5", width: "100%", marginBottom: "-0.8px"}}/>
            <Divider sx={{borderColor: "#837468", width: completeRate > 0 ? completeRate : 0}}/>
        </Stack>
    </StickyNote>
}
export default OrderPage;