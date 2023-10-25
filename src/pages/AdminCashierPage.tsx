import React, {useEffect, useState} from "react";
import {selectAllProduct, selectProductStatus,} from "../modules/redux/product/productsSlice";
import {useAppDispatch, useAppSelector} from "../modules/redux/store";
import {useParams} from "react-router-dom";
import {Order, ProductAmount, Status} from "../modules/redux/order/orderTypes";
import OrderForm from "../components/order/OrderForm";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    Grid, IconButton,
    Stack,
    Typography
} from "@mui/material";
import ShopManager from "../components/order/ShopManager";
import ReceivedOrderList from "../components/order/ReceivedOrderList";
import {selectShopUnsubscribe} from "../modules/redux/shop/shopsSlice";
import {useAuth} from "../AuthGuard";
import {addOrder, deleteOrder, fetchOrders, updateOrder} from "../modules/redux/order/ordersThunk";
import {streamProducts} from "../modules/redux/product/productsThunk";
import {selectOrderStatus, selectReceivedOrder, selectUnreceivedOrder} from "../modules/redux/order/orderSelectors";
import {selectAllStocks, selectStockStatus} from "../modules/redux/stock/stockSelectors";
import {streamStocks} from "../modules/redux/stock/stocksThunk";
import {Product} from "../modules/redux/product/productTypes";
import StickyNote from "../components/StickyNote";
import {getOrderLabel} from "../modules/util/orderUtils";
import {MotionList, MotionListItem} from "../components/motion/motionList";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import {NeumoContainer} from "../components/neumo";
import StockTable from "../components/cashier/StockTable";

const AdminCashierPage = () => {
    const [openDelete, setOpenDelete] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});

    const params = useParams();
    const shopId = params.shopId ?? "";

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const products = useAppSelector(state => selectAllProduct(state, shopId));
    const productStatus = useAppSelector(state => selectProductStatus(state, shopId));

    const orderStatus = useAppSelector(state => selectOrderStatus(state, shopId));
    const unreceivedOrders = useAppSelector(state => selectUnreceivedOrder(state, shopId));
    const receivedOrders = useAppSelector(state => selectReceivedOrder(state, shopId));

    const stockStatus = useAppSelector(state => selectStockStatus(state, shopId))
    const stocks = useAppSelector(state => selectAllStocks(state, shopId));

    const shopUnsubscribe = useAppSelector(selectShopUnsubscribe);

    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    };

    useEffect(() => {
        if (orderStatus === "idle") {
            dispatch(fetchOrders(shopId));
        }
    }, [orderStatus, shopId, dispatch])

    useEffect(() => {
        if (productStatus === "idle") {
            const unsub = streamProducts(shopId, {dispatch})

            return () => {
                unsub()
            }
        }
        // empty array でないと unsub() が2回呼ばれる
    }, []);

    useEffect(() => {
        if (stockStatus === "idle") {
            console.log("start stream stocks")
            const unsub = streamStocks(shopId, {dispatch})

            return () => {

                console.log("stop stream stocks")
                unsub()
            }
        }
    }, [])

    useEffect(() => {
        if (shopUnsubscribe != null) {
            shopUnsubscribe();
        }
    }, [shopUnsubscribe]);

    const onOrderAddClicked = async () => {
        const trueProductAmount = Object.assign({}, productAmount);
        // 量がゼロの要素は排除する
        for (const id in trueProductAmount) {
            if (trueProductAmount[id] == 0) {
                delete trueProductAmount[id];
            }
        }
        setProductAmount({});

        await dispatch(
            addOrder({
                shopId: shopId,
                orderForAdd: {
                    product_amount: trueProductAmount,
                },
            })
        );
    };

    const handleReceiveOrder = (order: Order) => {
        dispatch(updateOrder({shopId, newOrder: {...order, status: "received"}}));
    }

    const handleUnreceiveOrder = (order: Order) => {
        dispatch(updateOrder({shopId, newOrder: {...order, status: "idle"}}));
    }

    const handleDeleteOrder = (order: Order) => {
        setOrderToDelete(order);
        setOpenDelete(true);
    }

    const handleCloseDelete = () => {
        setOpenDelete(false);
    }

    const handleDelete = () => {
        if (orderToDelete != null) {
            dispatch(deleteOrder({shopId, order: orderToDelete}));
            setOpenDelete(false);
        }
    }

    const handleSwitchStatus = (order: Order, orderStatusId: string, status: Status) => {
    }

    return (
        !auth.loading ?
            <React.Fragment>
                <Grid container spacing={4} sx={{padding: "30px 30px"}}>
                    <Grid item xs={12} sm={6} lg={5}>
                        <Stack spacing={4}>
                            <NeumoContainer key={"order-form-container"}>
                                <OrderForm products={products} onChangeAmount={onChangeAmount} productAmount={productAmount}
                                           onOrderAddClicked={onOrderAddClicked}/>
                            </NeumoContainer>
                            <NeumoContainer key={"shop-manager-container"}>
                                <ShopManager/>
                            </NeumoContainer>
                        </Stack>
                    </Grid>
                    <Grid item container xs={12} sm={6} lg={7} spacing={4}>
                        <Grid item md={12} lg={7}>
                            <NeumoContainer key={"unreceived-orders-container"}>
                                <MotionList layoutId={"unreceived-orders"} style={{display: "flex", flexDirection: "column", gap: "1rem"}}>
                                    {unreceivedOrders.map(o =>
                                        <MotionListItem key={o.id}>
                                            <UnreceivedOrderItem order={o}
                                                                 products={products}
                                                                 onClickDelete={handleDeleteOrder}
                                                                 onClickReceive={handleReceiveOrder}/>
                                        </MotionListItem>
                                    )}
                                </MotionList>
                            </NeumoContainer>
                        </Grid>
                        <Grid item md={12} lg={5}>
                            <NeumoContainer key={"stock-table-container"}>
                                <StockTable stocks={stocks} products={products}/>
                            </NeumoContainer>
                            <ReceivedOrderList receivedOrders={receivedOrders} products={products}
                                               onClickUnreceive={handleUnreceiveOrder}/>
                        </Grid>
                    </Grid>
                </Grid>
                <Dialog open={openDelete}
                        onClose={handleCloseDelete}
                        aria-labelledby="order-delete-alert-dialog"
                        aria-describedby="check-order-delete-alert">
                    <DialogTitle id={"order-delete-alert-title"}>
                        {orderToDelete?.index}番の注文を消去しますか？
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-dialog-description">
                            注文の消去は取り消せません
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDelete}>キャンセル</Button>
                        <Button onClick={handleDelete} autoFocus>
                            消去する
                        </Button>
                    </DialogActions>
                </Dialog>
            </React.Fragment>
            : <CircularProgress/>
    )
}

const UnreceivedOrderItem = (props: {
    order: Order,
    products: Product[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void,
}) => {
    const {order, products, onClickReceive, onClickDelete} = props;

    return <StickyNote direction={"row"} sx={{alignItems: "stretch", justifyContent: "space-between", padding: "0.375rem 0.5rem"}} spacing={1}>
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

export default AdminCashierPage;
