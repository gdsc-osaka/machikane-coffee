import React, {useEffect, useState} from "react";
import {selectAllProduct, selectProductStatus,} from "../modules/redux/product/productsSlice";
import {useAppDispatch, useAppSelector} from "../modules/redux/store";
import {useParams} from "react-router-dom";
import {Order, ProductAmount} from "../modules/redux/order/orderTypes";
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack
} from "@mui/material";
import ShopManager from "../components/cashier/ShopManager";
import ReceivedOrderListItem from "../components/cashier/ReceivedOrderListItem";
import {selectShopUnsubscribe} from "../modules/redux/shop/shopsSlice";
import {useAuth} from "../AuthGuard";
import {
    addOrder,
    deleteOrder,
    fetchOrders,
    receiveOrder,
    receiveOrderIndividual,
    updateOrder
} from "../modules/redux/order/ordersThunk";
import {streamProducts} from "../modules/redux/product/productsThunk";
import {selectOrderStatus, selectReceivedOrder, selectUnreceivedOrder} from "../modules/redux/order/orderSelectors";
import {selectAllStocks, selectStockStatus} from "../modules/redux/stock/stockSelectors";
import {streamStocks} from "../modules/redux/stock/stocksThunk";
import {MotionListItem} from "../components/motion/motionList";
import {NeumoContainer} from "../components/neumo";
import StockTable from "../components/cashier/StockTable";
import ProductCounter from "../components/cashier/ProductCounter";
import SubTotal from "../components/cashier/SubTotal";
import {UnreceivedOrderItem} from "../components/cashier/UnreceivedOrderItem";
import OrdersList from "../components/cashier/OrdersList";

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

    useEffect(() => {
        // console.log(products)
    }, [products])

    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    };

    useEffect(() => {
        if (orderStatus === "idle") {
            dispatch(fetchOrders(shopId));
        }
    }, [orderStatus, shopId, dispatch])

    useEffect(() => {
        let prodUnsub = () => {};
        let stockUnsub = () => {};

        if (productStatus === "idle") {
            prodUnsub = streamProducts(shopId, {dispatch})
        }

        if (stockStatus === "idle") {
            stockUnsub = streamStocks(shopId, {dispatch})
        }

        return () => {
            prodUnsub();
            stockUnsub();
        }
        // empty array でないと unsub() が2回呼ばれる
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
                    product_amount: trueProductAmount,
                },
            })
        );
    };

    const handleReceiveOrder = (order: Order) => {
        dispatch(receiveOrder({shopId, order}));
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

    const handleReceiveIndividual = (order: Order, productStatusKey: string) => {
        dispatch(receiveOrderIndividual({shopId, order, productStatusKey})).unwrap().catch(e => console.log(e))
    }

    return (
        !auth.loading ?
            <React.Fragment>
                <Stack direction={'row'} spacing={4} sx={{padding: "30px 30px"}}
                       alignItems={'flex-start'}>
                    <Stack spacing={4}>
                        <NeumoContainer key={"order-form-container"}>
                            <Stack direction={"row"} spacing={3}>
                                <ProductCounter products={products}
                                                productAmount={productAmount}
                                                onChangeAmount={onChangeAmount}/>
                                <Stack justifyContent={"space-between"} alignItems={"stretch"}>
                                    <SubTotal productAmount={productAmount}
                                              products={products}
                                              onClickButton={onOrderAddClicked}/>
                                    <NeumoContainer key={"stock-table-container"} type={'pressed'}>
                                        <StockTable stocks={stocks} products={products}/>
                                    </NeumoContainer>
                                </Stack>
                            </Stack>
                        </NeumoContainer>
                        <NeumoContainer key={"shop-manager-container"}>
                            <ShopManager/>
                        </NeumoContainer>
                    </Stack>
                    {unreceivedOrders.length > 0 &&
                        <OrdersList layoutId={"unreceived-orders"} grid={1}>
                            {unreceivedOrders.map(o =>
                                <MotionListItem key={o.id}>
                                    <UnreceivedOrderItem order={o}
                                                         products={products}
                                                         onClickDelete={handleDeleteOrder}
                                                         onClickReceive={handleReceiveOrder}
                                                         onReceiveIndividual={handleReceiveIndividual}/>
                                </MotionListItem>
                            )}
                        </OrdersList>
                    }
                    {receivedOrders.length > 0 &&
                        <OrdersList layoutId={"received-orders"} grid={1}>
                            {receivedOrders.map(o =>
                                <MotionListItem key={o.id}>
                                    <ReceivedOrderListItem order={o}
                                                           onClickUnreceive={handleUnreceiveOrder}/>
                                </MotionListItem>
                            )}
                        </OrdersList>
                    }
                </Stack>
                <Dialog open={openDelete}
                        onClose={handleCloseDelete}
                        aria-labelledby="order-delete-alert-dialog"
                        aria-describedby="check-order-delete-alert">
                    <DialogTitle id={"order-delete-alert-title"}>
                        {orderToDelete?.index}番の注文と関連する在庫データを消去しますか？
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
