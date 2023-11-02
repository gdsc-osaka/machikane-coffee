import React, {useState} from "react";
import {selectAllProducts,} from "../modules/redux/product/productsSlice";
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
    Stack,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material";
import ShopManager from "../components/cashier/ShopManager";
import ReceivedOrderListItem from "../components/cashier/ReceivedOrderListItem";
import {useAuth} from "../AuthGuard";
import {
    addOrder,
    deleteOrder,
    receiveOrder,
    receiveOrderIndividual,
    unreceiveOrder
} from "../modules/redux/order/ordersThunk";
import {selectReceivedOrder, selectUnreceivedOrder} from "../modules/redux/order/orderSelectors";
import {selectAllStocks} from "../modules/redux/stock/stockSelectors";
import {MotionList, MotionListItem} from "../components/motion/motionList";
import {NeumoContainer} from "../components/neumo";
import StockTable from "../components/cashier/StockTable";
import ProductCounter from "../components/cashier/ProductCounter";
import SubTotal from "../components/cashier/SubTotal";
import {UnreceivedOrderItem} from "../components/cashier/UnreceivedOrderItem";
import OrdersList from "../components/cashier/OrdersList";
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {CaptionCard} from "../components/OutlineCard";

const AdminCashierPage = () => {
    const [openDelete, setOpenDelete] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});

    const params = useParams();
    const shopId = params.shopId ?? "";

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isSmall = useMediaQuery(theme.breakpoints.down('lg'));

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const products = useAppSelector(state => selectAllProducts(state, shopId));

    const unreceivedOrders = useAppSelector(state => selectUnreceivedOrder(state, shopId));
    const receivedOrders = useAppSelector(state => selectReceivedOrder(state, shopId));

    const stocks = useAppSelector(state => selectAllStocks(state, shopId));

    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    };

    useStreamEffect(shopId, "order", "product", "stock")

    const onOrderAddClicked = async () => {
        const trueProductAmount = Object.assign({}, productAmount);
        // 量がゼロの要素は排除する
        for (const id in trueProductAmount) {
            if (trueProductAmount[id] === 0) {
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
        dispatch(unreceiveOrder({shopId, order}));
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
        dispatch(receiveOrderIndividual({shopId, order, productStatusKey}))
    }

    return (
        !auth.loading ?
            <React.Fragment>
                {isMobile ?
                    <Stack spacing={2} sx={{padding: "20px 10px"}}>
                        <MotionList layoutId={"cashier-page-root"} style={{gap: "1.5rem", display: 'flex', flexDirection: 'column'}}>
                            <Typography variant={"h5"}>
                                待機中の注文
                            </Typography>
                            <div>
                                {unreceivedOrders.length === 0 &&
                                    <CaptionCard>
                                        待機中の注文はありません
                                    </CaptionCard>
                                }
                                <div style={{gap: '1rem', display: 'flex', flexDirection: 'column', paddingBottom: "1rem"}}>
                                    {unreceivedOrders.map(order =>
                                        <MotionListItem key={order.id}>
                                            <UnreceivedOrderItem order={order}
                                                                 products={products}
                                                                 onClickDelete={handleDeleteOrder}
                                                                 onClickReceive={handleReceiveOrder}
                                                                 onReceiveIndividual={handleReceiveIndividual}/>
                                        </MotionListItem>
                                    )}
                                </div>
                            </div>
                            <MotionListItem>
                                <Typography variant={"h5"}>
                                    受取済み注文
                                </Typography>
                            </MotionListItem>
                            <div>
                                {receivedOrders.length === 0 &&
                                    <CaptionCard>
                                        受取済み注文はありません
                                    </CaptionCard>
                                }
                                <div style={{gap: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr'}}>
                                    {receivedOrders.map(order =>
                                        <MotionListItem key={order.id}>
                                            <ReceivedOrderListItem order={order}
                                                                   onClickUnreceive={handleUnreceiveOrder}/>
                                        </MotionListItem>
                                    )}
                                </div>
                            </div>
                        </MotionList>
                    </Stack>
                    :
                    <Stack direction={'row'} spacing={4} sx={{padding: "30px 30px"}}
                           alignItems={'flex-start'}>
                        <Stack spacing={4} minWidth={"570px"}>
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
                        <Stack direction={isSmall ? "column" : "row"} spacing={4}
                               alignItems={isSmall ? "stretch" : 'flex-start'}>
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
                                <OrdersList layoutId={"received-orders"} grid={isSmall ? 2 : 1}>
                                    {receivedOrders.map(o =>
                                        <MotionListItem key={o.id}>
                                            <ReceivedOrderListItem order={o}
                                                                   onClickUnreceive={handleUnreceiveOrder}/>
                                        </MotionListItem>
                                    )}
                                </OrdersList>
                            }
                        </Stack>
                    </Stack>
                }
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
            :
            <Stack>
                <CircularProgress/>
            </Stack>
    )
}

export default AdminCashierPage;
