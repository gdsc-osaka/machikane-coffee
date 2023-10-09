import {Button, Divider, Stack, Switch, TextField, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {selectOrderByIndex, selectOrderUnsubscribe, streamOrder} from "../modules/redux/order/ordersSlice";
import {useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {Order} from "../modules/redux/order/types";
import StickyNote from "../components/StickyNote";
import {Flex} from "../components/layout/Flex";
import {Product} from "../modules/redux/product/types";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {M3Switch} from "../components/M3Switch";
import {useCountDownInterval} from "../modules/hooks/useCountDownInterval";

const OrderPage = () => {
    const [orderIndex, setOrderIndex] = useState<string>("");

    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const order = useSelector((state: RootState) => selectOrderByIndex(state, Number(orderIndex)));
    const unsubscribe = useSelector(selectOrderUnsubscribe);

    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    const handleOrderIndex = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const num = Number(e.target.value);
        if (!isNaN(num) && num != 0) {
            setOrderIndex(num.toString());

        } else if (e.target.value == "") {
            setOrderIndex("");
        }
    }

    const handleSubmit = async () => {
        if (unsubscribe != null) {
            unsubscribe();
        }

        const num = Number(orderIndex);

        if (!isNaN(num)) {
            try {
                await dispatch(streamOrder({shopId: shopId, orderIndex: num}));
            } catch (e) {
                // TODO: ちゃんとエラーハンドリングする
                if (e == 'Order not found.') {

                }
            }
        }
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
                    disabled={orderIndex == undefined} onClick={() => handleSubmit()}>
                確認
            </Button>
        </Stack>
        {order !== undefined && <OrderCard order={order} products={products}/>}
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
                                    <Typography variant={"h3"}>
                                        {untilMin}
                                    </Typography>
                                    <Typography variant={"h4"} sx={{paddingBottom: "0.25rem", fontWeight: "800"}}>
                                        分
                                    </Typography>
                                </React.Fragment>}
                            {untilSec > 0 &&
                                <React.Fragment>
                                    <Typography variant={"h3"} sx={{paddingLeft: "0.2rem"}}>
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
                    <Typography variant={"h3"} textAlign={"right"}>
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