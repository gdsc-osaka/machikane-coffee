import {Button, Dialog, DialogActions, DialogTitle, Divider, Stack, TextField, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {selectOrderById, selectOrderUnsubscribe, streamOrder} from "../modules/redux/order/ordersSlice";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {Order} from "../modules/redux/order/types";
import StickyNote from "../components/StickyNote";
import {Product} from "../modules/redux/product/types";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {useCountDownInterval} from "../modules/hooks/useCountDownInterval";
import {ShopStatus} from "../modules/redux/shop/types";
import {
    fetchShops,
    selectAllShops,
    selectShopById,
    selectShopStatus,
    streamShop
} from "../modules/redux/shop/shopsSlice";
import DelayContainer from "../components/User/delayContainer";

// queryParamで使うキー
const orderIndexParamKey = 'order';

type DialogState = {
    open: boolean,
    title: string,
    onOk: () => void,
}

const OrderPage = () => {
    const [orderIndex, setOrderIndex] = useState<string>("");
    const [orderId, setOrderId] = useState("");
    const [dialogState, setDialogState] = useState<DialogState>({
        open: false,
        title: "",
        onOk: () => {}
    });

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const [searchParams, setSearchParams] = useSearchParams();
    const paramOrderIndex = searchParams.get(orderIndexParamKey);
    const order = useSelector((state: RootState) => selectOrderById(state, orderId));
    const unsubscribe = useSelector(selectOrderUnsubscribe);

    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);
    const shop = useSelector((state: RootState) => selectShopById(state, shopId));
    const allShops = useSelector(selectAllShops);
    const shopStatus = useSelector(selectShopStatus);

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus, shopId]);

    useEffect(() => {
        if (shopStatus == "idle" || shopStatus == "failed") {
            dispatch(fetchShops());
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus, shopId]);

    useEffect(() => {
        if (shopId !== undefined && allShops.length !== 0 &&
            !allShops.map(s => s.id).includes(shopId)) {
            // 存在しないshop id なら
            setDialogState({
                open: true,
                title: "該当するIDの店舗が見つかりません",
                onOk: () => {
                    handleClose();
                    navigate('/');
                }
            })
        }
    }, [shopId, allShops]);

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

        if (orderIndex === '') {
            setDialogState({
                open: true,
                title: "注文番号を入力してください",
                onOk: handleClose
            })

            return;
        }

        const num = Number(orderIndex);

        if (!isNaN(num)) {
            await dispatch(streamOrder({shopId: shopId, orderIndex: num}))
                .unwrap()
                .then((payload) => {
                    setOrderId(payload.order.id);

                    setSearchParams({[orderIndexParamKey]: orderIndex});
                })
                .catch((e) => {
                    setDialogState({
                        open: true,
                        title: "該当する番号の注文が見つかりません",
                        onOk: () => handleClose()
                    });
                });

        }
    }

    const handleClose = () => {
        setDialogState({
            ...dialogState, open: false,
        });
    }

    return <Stack spacing={2} padding={"1rem"}>
        {shop !== undefined && <DelayContainer shop={shop}/>}
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
        {(order !== undefined && shop != undefined) && <OrderCard order={order} products={products} shopStatus={shop.status} delaySec={0}/>}
        <Dialog open={dialogState.open} onClose={handleClose}>
            <DialogTitle>
                {dialogState.title}
            </DialogTitle>
            <DialogActions>
                <Button onClick={dialogState.onOk}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    </Stack>
}

const OrderCard = (props: {order: Order, products: Product[], shopStatus: ShopStatus, delaySec: number}) => {
    const [untilCount, setUntilCount] = useState(0);

    const {order, products, shopStatus, delaySec} = props;
    const untilTime = order.complete_at.toDate().getTime() - new Date().getTime();
    const until = new Date(untilTime);
    const untilSec = untilCount % 60;
    const untilMin = Math.floor(untilCount / 60);
    const untilHou = Math.floor(untilMin / 60);
    const completeRate = untilTime / (order.complete_at.toDate().getTime() - order.created_at.toDate().getTime());
    const productTexts = Object.keys(order.product_amount).map(key => `${products.find(e => e.id == key)?.display_name ?? '???'} × ${order.product_amount[key]}`);
    const fontColor = shopStatus === "pause_ordering" ? "#410002" : "#201B16";

    const isCompleted = order.status === "completed";

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
                    {!isCompleted && (untilCount > 0  ?
                        <Stack direction={"row"} spacing={0.7} alignItems={"flex-end"}>
                            {untilHou > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor}>
                                        {untilHou}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}} color={fontColor}>
                                        時間
                                    </Typography>
                                </React.Fragment>}
                            {untilMin > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor}>
                                        {untilMin}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}} color={fontColor}>
                                        分
                                    </Typography>
                                </React.Fragment>}
                            {untilSec > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{paddingLeft: "0.2rem", fontWeight: "bold"}} color={fontColor}>
                                        {untilSec}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}} color={fontColor}>
                                        秒
                                    </Typography>
                                </React.Fragment>}
                        </Stack>
                        :
                        <Typography sx={{fontWeight: "bold"}}>
                            まもなく完成します･･･
                        </Typography>)
                    }
                    {isCompleted &&
                        <Typography sx={{fontWeight: "bold"}}>
                            完成済みです
                            <br/>受け取りをお待ちしております
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
            {/*<Stack>*/}
            {/*    <Typography variant={"caption"}>*/}
            {/*        通知設定*/}
            {/*    </Typography>*/}
            {/*    <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}*/}
            {/*           sx={{height: "38px"}}>*/}
            {/*        <Typography variant={"body1"}>*/}
            {/*            商品完成時に通知を受け取る*/}
            {/*        </Typography>*/}
            {/*        <M3Switch/>*/}
            {/*    </Stack>*/}
            {/*</Stack>*/}
        </Stack>
        <Stack alignItems={"end"}>
            <Divider sx={{borderColor: "#D5C3B5", width: "100%", marginBottom: "-0.8px"}}/>
            <Divider sx={{borderColor: "#837468", width: completeRate > 0 ? completeRate : 0}}/>
        </Stack>
    </StickyNote>
}
export default OrderPage;