import React, {useEffect, useState} from "react";
import styled from "styled-components";
import {useSelector} from "react-redux";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {useAppDispatch} from "../modules/redux/store";
import {useParams} from "react-router-dom";
import {Order, ProductAmount} from "../modules/redux/order/types";
import OrderForm from "../components/order/OrderForm";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material";
import {
    addOrder, deleteOrder, fetchOrders,
    selectOrderStatus,
    selectReceivedOrder,
    selectUnreceivedOrder, updateOrder
} from "../modules/redux/order/ordersSlice";
import OrderList from "../components/order/OrderList";
import ShopManager from "../components/order/ShopManager";
import ReceivedOrderList from "../components/order/ReceivedOrderList";

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
            dispatch(fetchOrders(shopId));
        }
    }, [dispatch, orderStatus]);

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
        console.log("update")
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
            <RowLayout>
                <Column>
                    <OrderForm products={products} onChangeAmount={onChangeAmount} productAmount={productAmount} onOrderAddClicked={onOrderAddClicked}/>
                    <ShopManager/>
                </Column>
                <OrderList orders={unreceivedOrders} products={products} onClickReceive={handleReceiveOrder} onClickDelete={handleDeleteOrder}/>
                <ReceivedOrderList receivedOrders={receivedOrders} products={products} onClickUnreceive={handleUnreceiveOrder}/>
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
            </RowLayout>
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