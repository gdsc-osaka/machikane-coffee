import React, {useEffect, useState} from "react";
import styled from "styled-components";
import {useSelector} from "react-redux";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {useAppDispatch} from "../modules/redux/store";
import {useParams} from "react-router-dom";
import {Order, ProductAmount} from "../modules/redux/order/types";
import OrderForm from "../components/order/OrderForm";
import {
    Button, Card,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle, Grid, Stack
} from "@mui/material";
import {
    addOrder, deleteOrder,
    selectOrderStatus,
    selectReceivedOrder,
    selectUnreceivedOrder, streamOrders, updateOrder
} from "../modules/redux/order/ordersSlice";
import OrderList from "../components/order/OrderList";
import ShopManager from "../components/order/ShopManager";
import ReceivedOrderList from "../components/order/ReceivedOrderList";
import {selectShopUnsubscribe} from "../modules/redux/shop/shopsSlice";

const AdminPage = () => {
    const [openDelete, setOpenDelete] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

    const dispatch = useAppDispatch();
    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);
    const unreceivedOrders = useSelector(selectUnreceivedOrder);
    const receivedOrders = useSelector(selectReceivedOrder);
    const orderStatus = useSelector(selectOrderStatus);
    const params = useParams();
    const shopId = params.shopId ?? '';

    const shopUnsubscribe = useSelector(selectShopUnsubscribe);

    const [productAmount, setProductAmount] = useState<ProductAmount>({});
    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    }

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(streamOrders(shopId));
        }
    }, [dispatch, orderStatus]);

    useEffect(() => {
        if (shopUnsubscribe != null) {
            shopUnsubscribe();
        }
    }, []);

    const onOrderAddClicked = async () => {
        const trueProductAmount = Object.assign({}, productAmount);
        // 量がゼロの要素は排除する
        for (const id in trueProductAmount) {
            if (trueProductAmount[id] == 0) {
                delete trueProductAmount[id];
            }
        }

        await dispatch(addOrder({shopId: shopId, rawOrder: {is_student: false, product_amount: trueProductAmount, status: "idle"}}));
    }

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

    return(
        productStatus == "succeeded" ?
            <React.Fragment>
                <Grid container spacing={4} sx={{padding: "30px 30px"}}>
                    <Grid item xs={12} sm={6} lg={5}>
                        <Stack spacing={4}>
                            <OrderForm products={products} onChangeAmount={onChangeAmount} productAmount={productAmount} onOrderAddClicked={onOrderAddClicked}/>
                            <Card sx={{width: "100%", padding: "20px"}}>
                                <ShopManager/>
                            </Card>
                        </Stack>
                    </Grid>
                    <Grid item container xs={12} sm={6} lg={7} spacing={4}>
                        <Grid item xs={12} sm={12} lg={6}>
                            <OrderList orders={unreceivedOrders} products={products} onClickReceive={handleReceiveOrder} onClickDelete={handleDeleteOrder}/>
                        </Grid>
                        <Grid item xs={12} sm={12} lg={6}>
                            <ReceivedOrderList receivedOrders={receivedOrders} products={products} onClickUnreceive={handleUnreceiveOrder}/>
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
            : <CircularProgress />
    )
}

const RowLayout = styled.div`
  display: flex;
  width: auto;
  height: auto;
  padding: 1rem 2rem;
  justify-content: left;
  align-items: flex-start;
  gap: 1rem;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3vh;
`

export default AdminPage;