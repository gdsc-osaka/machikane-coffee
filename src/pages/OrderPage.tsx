import {Button, Dialog, DialogActions, DialogTitle, Divider, Stack, TextField, Typography} from "@mui/material";
import React, {useEffect, useMemo, useState} from "react";
import {RootState, useAppDispatch, useAppSelector} from "../modules/redux/store";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import {Order} from "../modules/redux/order/orderTypes";
import StickyNote from "../components/StickyNote";
import {Product} from "../modules/redux/product/productTypes";
import {selectAllProducts} from "../modules/redux/product/productsSlice";
import {ShopStatus} from "../modules/redux/shop/shopTypes";
import {selectShopById, selectShopDelaySeconds, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import DelayContainer from "../components/User/delayContainer";
import MyMarkdown from "src/components/MyMarkdown";
import {MotionList, MotionListItem} from "../components/motion/motionList";
import {fetchOrderByIndex, streamOrder} from "../modules/redux/order/ordersThunk";
import {selectOrderById, selectOrderStatus} from "../modules/redux/order/orderSelectors";
import {orderAdded} from "../modules/redux/order/ordersSlice";
import {isOrderCompleted} from "../modules/util/orderUtils";
import {useDate} from "../modules/hooks/useDate";
import {MotionDivider} from "../components/motion/MotionDivider";
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {useAuth} from "../AuthGuard";

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
    const authState = useAuth();

    // Order関連
    const order = useAppSelector(state => selectOrderById(state, shopId, orderId));
    const orderStatus = useAppSelector(state => selectOrderStatus(state, shopId))

    // Product関連
    const products = useAppSelector(state => selectAllProducts(state, shopId));

    // Shop関連
    const shop = useAppSelector((state: RootState) => selectShopById(state, shopId));
    const shopStatus = useAppSelector(state => selectShopStatus(state));
    const delaySec = useAppSelector(state => selectShopDelaySeconds(state, shopId));

    useStreamEffect(shopId, "shop", "product");

    useEffect(() => {
        if (orderId !== '') {
            const unsub = streamOrder(shopId, orderId, {dispatch});

            return () => {
                unsub();
            }
        }
    }, [orderId])

    useEffect(() => {
        // shopIdに該当するshopが存在しないあるいはadmin権限がないユーザーがinactiveのショップを開いた場合
        if (shopStatus === 'succeeded' && (shop === undefined || (shop.status === 'inactive' && authState.role === 'user'))) {
            setDialogState({
                open: true,
                title: "該当するIDの店舗が見つかりません",
                onOk: () => {
                    handleClose();
                    navigate('/');
                }
            })
        }
    }, [shopStatus, shop])

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

    useEffect(() => {
        console.log(order);
    }, [order])

    return <Stack spacing={3} padding={"1rem"}>
        {shop !== undefined && <DelayContainer shop={shop} delaySec={delaySec}/>}
        <Typography variant={"h5"} fontWeight={"bold"}>
            {shop !== undefined ? `${shop.display_name} - ` : ''}注文照会
        </Typography>
        <Stack direction={"row"} spacing={1} component={"form"} onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const orderIndex = formData.get("order-index") as string ?? ""
            handleSubmit(orderIndex)
        }}>
            <TextField id={"order-index"} variant={"filled"} name={"order-index"}
                       label={"注文番号"} // helperText={"番号札に記入された数字を入力してください"}
                       type={"number"} required fullWidth autoFocus
                       value={oIndexInput} onChange={handleOrderIndex}/>
            <Button variant={"contained"} sx={{minWidth: "100px"}}
                    disabled={oIndexInput === ''} type={"submit"}>
                確認
            </Button>
        </Stack>
        <MotionList layoutId={"order-page-stack"}>
            {(order !== undefined && shop !== undefined) &&
                <MotionListItem>
                    <OrderCard order={order} products={products} shopStatus={shop.status}
                               delaySec={order.delay_seconds + delaySec}/>
                </MotionListItem>
            }
            {shop !== undefined && shop.message !== '' &&
                <MotionListItem>
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
    return <Stack sx={{boxShadow: "none", padding: "1rem 0"}}>
        <MyMarkdown>
            {props.message}
        </MyMarkdown>
    </Stack>
}

const OrderCard = (props: {
    order: Order,
    products: Product[],
    shopStatus: ShopStatus,
    delaySec: number,
}) => {
    const {order, products, shopStatus, delaySec} = props;

    const isPause = shopStatus === "pause_ordering";
    const now = useDate(1, isPause);
    const nowSec = Math.floor(now / 1000);
    const productTexts = Object.keys(order.product_amount)
        .map(key => {
            return {
                text: `${products.find(e => e.id === key)?.display_name ?? '???'} × ${order.product_amount[key]}`,
                key
            }
        });
    const fontColor = isPause ? "#410002" : "#201B16";

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
    const completeAt = order.complete_at.seconds + order.delay_seconds;

    const untilCount = completeAt - nowSec;
    const untilSec = untilCount % 60;
    const untilMin = untilCount > 0 ? Math.floor(untilCount / 60) : -1;
    const untilHou = untilCount > 0 ? Math.floor(untilMin / 60) : -1;
    const completeRate = status === 'idle' ? untilCount / (completeAt - order.created_at.seconds) : 0;

    return <StickyNote>
        <Stack spacing={3} sx={{width: "100%", padding: "1rem 1.5rem"}}>
            <Stack direction={"row"} justifyContent={"space-between"}>
                <Stack spacing={1}>
                    <Typography variant={"caption"}>
                        完成予定まで
                    </Typography>
                    {status === 'idle' && (untilCount > 0 ?
                        <Stack direction={"row"} spacing={0.7} alignItems={"flex-end"}>
                            {untilHou > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor}>
                                        {untilHou}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor}>
                                        時間
                                    </Typography>
                                </React.Fragment>}
                            {untilMin > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{fontWeight: "bold"}} color={fontColor}>
                                        {untilMin}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor}>
                                        分
                                    </Typography>
                                </React.Fragment>}
                            {untilSec > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{paddingLeft: "0.2rem", fontWeight: "bold"}}
                                                color={fontColor}>
                                        {untilSec}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}
                                                color={fontColor}>
                                        秒
                                    </Typography>
                                </React.Fragment>}
                        </Stack>
                        :
                        <Typography sx={{fontWeight: "bold"}} lineHeight={"175%"}>
                            まもなく完成します
                            <br/>お店の前までお越しください
                        </Typography>)
                    }
                    {status === 'completed' &&
                        <Typography sx={{fontWeight: "bold"}} lineHeight={"175%"}>
                            完成済みです
                            <br/>受け取りをお待ちしております
                        </Typography>

                    }
                    {status === 'received' &&
                        <Typography sx={{fontWeight: "bold"}} lineHeight={"175%"}>
                            商品は受け取り済みです
                            <br/>ご利用ありがとうございました
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
            {delaySec > 0 &&
                <Stack>
                    <Typography variant={"caption"}>
                        遅延
                    </Typography>
                    <Stack sx={{minHeight: "38px"}} justifyContent={"center"} spacing={1}>
                        <Typography variant={"body1"}>
                            約{Math.ceil(delaySec / 60)}分遅延しています
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
            <MotionDivider style={{borderColor: "#837468"}} width={`${completeRate > 0 ? (completeRate * 100) : 0}%`}/>
        </Stack>
    </StickyNote>
}
export default OrderPage;