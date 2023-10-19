import React, {useEffect, useState} from "react";
import {selectAllProduct, selectProductStatus,} from "../modules/redux/product/productsSlice";
import {RootState, useAppDispatch, useAppSelector} from "../modules/redux/store";
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
    Grid,
    Stack
} from "@mui/material";
import {
    selectOrderStatus,
    selectOrderUnsubscribe,
    selectReceivedOrder,
    selectUnreceivedOrder
} from "../modules/redux/order/ordersSlice";
import OrderList from "../components/order/OrderList";
import ShopManager from "../components/order/ShopManager";
import ReceivedOrderList from "../components/order/ReceivedOrderList";
import {selectShopUnsubscribe} from "../modules/redux/shop/shopsSlice";
import {useAuth} from "../AuthGuard";
import {addOrder, deleteOrder, streamOrders, updateOrder} from "../modules/redux/order/ordersThunk";
import {fetchProducts} from "../modules/redux/product/productsThunk";
import {useSelector} from "react-redux";

const AdminCashierPage = () => {
    const [openDelete, setOpenDelete] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});

    const params = useParams();
    const shopId = params.shopId ?? "";

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const products = useSelector((state: RootState) => selectAllProduct(state, shopId));
    const productStatus = useAppSelector(state => selectProductStatus(state, shopId));
    const unreceivedOrders = useSelector((state: RootState) => selectUnreceivedOrder(state, shopId));
    const receivedOrders = useSelector((state: RootState) => selectReceivedOrder(state, shopId));
    const orderStatus = useSelector((state: RootState) => selectOrderStatus(state, shopId));

    const shopUnsubscribe = useSelector(selectShopUnsubscribe);

    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    };

    useEffect(() => {
        dispatch(fetchProducts(shopId));
    }, [])

    useEffect(() => {
        if (orderStatus === "idle") {
            const unsub = streamOrders(shopId, {dispatch})

            return () => unsub()
        }
    }, []);

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
                    is_student: false,
                    product_amount: trueProductAmount,
                    status: "idle",
                },
            })
        );
    };

    const handleReceiveOrder = (order: Order) => {
        dispatch(updateOrder({shopId, newOrder: {...order, status: "received"}}));
    }

    const handleUnreceiveOrder = (order: Order) => {
        dispatch(updateOrder({shopId, newOrder: {...order, status: "completed"}}));
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
        const newOrder: Order = {
            ...order,
            order_statuses: {
                ...order.order_statuses,
                [orderStatusId]: {
                    ...order.order_statuses[orderStatusId],
                    status: status
                }
            }
        }

        dispatch(updateOrder({shopId, newOrder}));
    }

    return (
        !auth.loading ?
            <React.Fragment>
                <Grid container spacing={4} sx={{padding: "30px 30px"}}>
                    <Grid item xs={12} sm={6} lg={5}>
                        <Stack spacing={4}>
                            <OrderForm products={products} onChangeAmount={onChangeAmount} productAmount={productAmount}
                                       onOrderAddClicked={onOrderAddClicked}/>
                            <ShopManager/>
                        </Stack>
                    </Grid>
                    <Grid item container xs={12} sm={6} lg={7} spacing={4}>
                        <Grid item  md={12} lg={7}>
                            <OrderList orders={unreceivedOrders} products={products}
                                       onClickReceive={handleReceiveOrder}
                                       onClickDelete={handleDeleteOrder}
                                       onSwitchStatus={handleSwitchStatus}/>
                        </Grid>
                        <Grid item md={12} lg={5}>
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

export default AdminCashierPage;
