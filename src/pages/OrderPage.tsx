import {Button, Dialog, DialogActions, DialogTitle, Divider, Stack, TextField, Typography} from "@mui/material";
import React, {useEffect, useMemo, useState} from "react";
import {RootState, useAppDispatch, useAppSelector} from "../modules/redux/store";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Order} from "../modules/redux/order/orderTypes";
import StickyNote from "../components/StickyNote";
import {Product} from "../modules/redux/product/productTypes";
import {selectAllProducts, selectProductStatus} from "../modules/redux/product/productsSlice";
import {ShopStatus} from "../modules/redux/shop/shopTypes";
import {
    selectAllShops,
    selectShopById,
    selectShopDelaySeconds,
    selectShopStatus
} from "../modules/redux/shop/shopsSlice";
import DelayContainer from "../components/User/delayContainer";
import MyMarkdown from "src/components/MyMarkdown";
import {MotionList, MotionListItem} from "../components/motion/motionList";
import {fetchOrderByIndex, streamOrder} from "../modules/redux/order/ordersThunk";
import {streamProducts} from "../modules/redux/product/productsThunk";
import {fetchShops, streamShop} from "../modules/redux/shop/shopsThunk";
import {selectOrderById, selectOrderStatus} from "../modules/redux/order/orderSelectors";
import {orderAdded} from "../modules/redux/order/ordersSlice";
import {isOrderCompleted} from "../modules/util/orderUtils";
import {useDate} from "../modules/hooks/useDate";
import {streamStocksOfOrder} from "../modules/redux/stock/stocksThunk";
import {selectStocksOfOrder, selectStockStatus} from "../modules/redux/stock/stockSelectors";
import {Stock} from "../modules/redux/stock/stockTypes";

// queryParamで使うキー
const orderIndexParamKey = 'order';

type DialogState = {
    open: boolean,
    title: string,
    onOk: () => void,
}

const OrderPage = () => {
    const [oIndexInput, setOIndexInput] = useState("");
    const [orderId, setOrderId] = useState("");
    const [dialogState, setDialogState] = useState<DialogState>({
        open: false,
        title: "",
        onOk: () => {
        }
    });

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const [searchParams, setSearchParams] = useSearchParams();
    const paramOrderIndex = searchParams.get(orderIndexParamKey);

    // Order関連
    const order = useAppSelector(state => selectOrderById(state, shopId, orderId));
    const orderStatus = useAppSelector(state => selectOrderStatus(state, shopId))

    // Product関連
    const products = useAppSelector(state => selectAllProducts(state, shopId));
    const productStatus = useAppSelector(state => selectProductStatus(state, shopId))

    // Shop関連
    const shop = useAppSelector((state: RootState) => selectShopById(state, shopId));
    const shopStatus = useAppSelector(selectShopStatus);
    const allShops = useAppSelector(selectAllShops);
    const delaySec = useAppSelector(state => selectShopDelaySeconds(state, shopId));

    // Stock関連
    const stockStatus = useAppSelector(state => selectStockStatus(state, shopId));
    const stocks = useAppSelector(state => selectStocksOfOrder(state, shopId, orderId));

    useEffect(() => {
        if (productStatus === "idle") {
            const unsub = streamProducts(shopId, {dispatch})

            return () => {
                unsub();
            }
        }
    }, []);

    useEffect(() => {
        if (shopStatus === "idle") {
            dispatch(fetchShops());
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus, shopId]);

    useEffect(() => {
        if (orderId !== '') {
            let unsubOrder = () => {}, unsubStock = () => {};

            if (orderStatus === 'idle') {
                unsubOrder = streamOrder(shopId, orderId, {dispatch});
            }

            if (stockStatus === 'idle') {
                unsubStock = streamStocksOfOrder(shopId, orderId, {dispatch});
            }
            return () => {
                unsubStock();
                unsubOrder();
            }
        }
    }, [orderId])

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

        if (!isNaN(oIndex) && oIndex !== 0) {
            const strOIndex = oIndex.toString();
            setOIndexInput(strOIndex);
            handleSubmit(strOIndex);
        }
    }, [paramOrderIndex])

    const handleOrderIndex = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const num = Number(e.target.value);
        if (!isNaN(num) && num !== 0) {
            setOIndexInput(num.toString());

        } else if (e.target.value === "") {
            setOIndexInput("");
        }
    }

    const handleSubmit = async (orderIndex: string) => {
        const index = Number(orderIndex);

        if (orderIndex === '' || isNaN(index)) {
            setDialogState({
                open: true,
                title: "注文番号を入力してください",
                onOk: handleClose
            })
        } else {
            const order = await fetchOrderByIndex({shopId, orderIndex: index});

            if (order === undefined) {
                setDialogState({
                    open: true,
                    title: "該当する注文が見つかりませんでした",
                    onOk: handleClose
                })
            } else {
                setSearchParams({ [orderIndexParamKey]: index.toString() });
                dispatch(orderAdded({shopId, order}));
                setOrderId(order.id);
            }
        }
    }

    const handleClose = () => {
        setDialogState({
            ...dialogState, open: false,
        });
    }

    return <Stack spacing={3} padding={"1rem"}>
        <Typography variant={"h4"} fontWeight={"bold"}>
            {shop !== undefined && shop.display_name}
        </Typography>
        {shop !== undefined && <DelayContainer shop={shop} delaySec={delaySec}/>}
        <Typography variant={"h5"} fontWeight={"bold"}>
            注文照会
        </Typography>
        <Stack direction={"row"} spacing={1}>
            <TextField id={"order-index"} variant={"filled"}
                       label={"注文番号"} // helperText={"番号札に記入された数字を入力してください"}
                       type={"number"} required fullWidth
                       value={oIndexInput} onChange={handleOrderIndex} sx={{minWidth: "17rem"}}/>
            <Button variant={"contained"} sx={{minWidth: "100px"}}
                    disabled={oIndexInput === ''} onClick={() => handleSubmit(oIndexInput)}>
                確認
            </Button>
        </Stack>
        <MotionList layoutId={"order-page-stack"}>
            {(order !== undefined && shop !== undefined) &&
                <MotionListItem key={"order-card"}>
                    <div style={{paddingTop: "1rem"}}>
                        <OrderCard order={order}
                                   products={products}
                                   stocks={stocks}
                                   shopStatus={shop.status}
                                   delaySec={order.delay_seconds + delaySec}/>
                    </div>
                </MotionListItem>
            }
            {shop !== undefined && shop.message !== '' &&
                <MotionListItem key={"shop-message"}>
                    <ShopMessage message={shop.message}/>
                </MotionListItem>
            }
        </MotionList>
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

const ShopMessage = (props: { message: string }) => {
    return <Stack sx={{boxShadow: "none", padding: "1rem 0", paddingBottom: "2rem"}}>
        <MyMarkdown>
            {props.message}
        </MyMarkdown>
    </Stack>
}

const OrderCard = (props: {
    order: Order,
    products: Product[],
    stocks: Stock[],
    shopStatus: ShopStatus,
    delaySec: number,
}) => {
    const {order, products, stocks, shopStatus, delaySec} = props;

    const now = useDate();
    const nowSec = Math.floor(now.getTime() / 1000);
    const productTexts = Object.keys(order.product_amount)
        .map(key => {
            return {
                text: `${products.find(e => e.id === key)?.display_name ?? '???'} × ${order.product_amount[key]}`,
                key
            }
        });
    const fontColor = shopStatus === "pause_ordering" ? "#410002" : "#201B16";

    const status = useMemo(() => {
        if (order.status === "received") return "received";

        return isOrderCompleted(order, products, 'required_product_amount') ? 'completed' : 'idle';
    }, [order, products])

    // 商品の完成予定時刻を秒単位で
    // const completeAt = useMemo(() => {
    //     let untilCount = 0;
    //
    //     for (const productId in order.required_product_amount) {
    //         const product = products.find(p => p.id === productId);
    //         const requiredAmount = order.required_product_amount[productId];
    //
    //         if (product) {
    //             untilCount += (requiredAmount - product.stock) * product.span;
    //         }
    //     }
    //
    //     return order.created_at.seconds + untilCount;
    // }, [order, products])
    const completeAt = order.complete_at.seconds;

    const untilSec = completeAt - nowSec;
    const untilMin = untilSec > 0 ? Math.floor(untilSec / 60) : -1;
    const untilHou = untilSec > 0 ? Math.floor(untilMin / 60) : -1;
    const completeRate = untilSec / (completeAt - order.created_at.seconds);

    return <StickyNote>
        <Stack spacing={3} sx={{width: "100%", padding: "1rem 1.5rem"}}>
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Stack spacing={1}>
                    <Typography variant={"caption"} key={"head-1"}>
                        完成予定まで
                    </Typography>
                    {status === 'idle' && (untilSec > 0 ?
                        <Stack direction={"row"} spacing={0.7} alignItems={"flex-end"}>
                            {untilHou > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor} key={"until-hou"}>
                                        {untilHou}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor} key={"until-hou-label"}>
                                        時間
                                    </Typography>
                                </React.Fragment>}
                            {untilMin > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor} key={"until-min"}>
                                        {untilMin}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor} key={"until-min-label"}>
                                        分
                                    </Typography>
                                </React.Fragment>}
                            {untilSec > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{paddingLeft: "0.2rem", fontWeight: "bold"}}
                                                color={fontColor} key={"until-sec"}>
                                        {untilSec % 60}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor} key={"until-sec-label"}>
                                        秒
                                    </Typography>
                                </React.Fragment>}
                        </Stack>
                        :
                        <Typography sx={{fontWeight: "bold"}} key={"almost-complete"}>
                            まもなく完成します･･･
                        </Typography>)
                    }
                    {status === 'completed' &&
                        <Typography sx={{fontWeight: "bold"}} key={"completed"}>
                            完成済みです
                            <br/>受け取りをお待ちしております
                        </Typography>

                    }
                    {status === 'received' &&
                        <Typography sx={{fontWeight: "bold"}} key={"received"}>
                            商品は受け取り済みです
                            <br/>ご利用いただきありがとうございました
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
            {shopStatus === "pause_ordering" &&
                <Stack>
                    <Typography variant={"caption"}>
                        遅延
                    </Typography>
                    <Stack sx={{minHeight: "38px"}} justifyContent={"center"} spacing={1}>
                        <Typography variant={"body1"}>
                            全部で約{Math.floor(delaySec / 60)}分遅延しています
                        </Typography>
                    </Stack>
                </Stack>
            }
            {/*見出しとTypographyの間隔が、通知設定の物と合わないので仕方なくこの書き方*/}
            <Stack spacing={productTexts.length === 1 ? 0 : 1}>
                <Typography variant={"caption"}>
                    商品
                </Typography>
                <Stack sx={{minHeight: "38px"}} justifyContent={"center"} spacing={1}>
                    {productTexts.map(p => <Typography variant={"body1"} key={p.key}>
                        {p.text}
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