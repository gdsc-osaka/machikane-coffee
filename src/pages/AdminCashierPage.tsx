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
import ReceivedOrderList from "../components/cashier/ReceivedOrderList";
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
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {CaptionCard} from "../components/OutlineCard";
import toast from "react-hot-toast";
import Heading from "../components/Heading";
import {initialDialogState} from "../modules/util/stateUtils";
import {updateStockStatus} from "../modules/redux/stock/stocksThunk";
import {getOrderLabel, sortByCompleted} from "../modules/util/orderUtils";
import {Product} from "../modules/redux/product/productTypes";
import {Stock} from "../modules/redux/stock/stockTypes";

const AdminCashierPage = () => {
    const [dialog, setDialog] = useState(initialDialogState);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});

    const params = useParams();
    const shopId = params.shopId ?? "";

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isSmall = useMediaQuery(theme.breakpoints.down('lg'));

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const products = useAppSelector(state => selectAllProducts(state, shopId));

    const stocks = useAppSelector(state => selectAllStocks(state, shopId));

    const unreceivedOrders = useAppSelector(state => selectUnreceivedOrder(state, shopId))
        .sort((a, b) => sortByCompleted(a, b, stocks));
    const receivedOrders = useAppSelector(state => selectReceivedOrder(state, shopId));

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
        dispatch(receiveOrder({shopId, order})).catch(e => toast.error(e));
    }

    const handleUnreceiveOrder = (order: Order) => {
        setDialog({
            open: true,
            title: `${order.index}番の注文を未受け取りにしますか？`,
            description: `${getOrderLabel(order, products)}の商品が受け取り済みから完成済みに変更されます.`,
            onOk: () => dispatch(unreceiveOrder({shopId, order})).catch(e => toast.error(e))
        })
    }

    const handleDeleteOrder = (order: Order) => {
        setDialog({
            open: true,
            title: `${order.index}番の注文を消去しますか？`,
            description: "在庫情報などの関連するデータも削除されます. 注文の消去は取り消せません.",
            onOk: () => dispatch(deleteOrder({shopId, order}))
        });
    }

    const closeDialog = () => {
        setDialog(prev => {
            return {...prev, open: false}
        })
    }

    const handleReceiveIndividual = (order: Order, productStatusKey: string) => {
        dispatch(receiveOrderIndividual({shopId, order, productStatusKey}))
    }

    const handleCompleteOrder = (order: Order, productStatusKey: string) => {
        const prodStatus = order.product_status[productStatusKey];
        const stock = stocks
            .find(s => s.orderRef.id === order.id && s.product_id === prodStatus.product_id
                && (s.status === "idle" || s.status === 'working'))
        const product = products.find(p => p.id === prodStatus.product_id);

        if (stock && product) {
            setDialog({
                open: true,
                title: `${order.index}番の${product.display_name}を完成にしますか？`,
                description: stock.status === 'working' ? `この商品は${stock.barista_id}番のバリスタが作成中に設定しています` : `バリスタ係がバリスタページから完成にすることを推奨します`,
                onOk: () => dispatch(updateStockStatus({shopId, stock, baristaId: 0, status: "completed"}))
                    .catch(e => toast.error(e))

            });
        } else {
            setDialog({
                open: true,
                title: `該当するStockデータが見つかりません.`,
                description: ``,
                onOk: closeDialog
            })
        }
    }

    const handleAllCompleteOrder = (order: Order) => {
        setDialog({
            open: true,
            title: `${order.index}番の注文をまとめて完成にしますか？`,
            description: `${getOrderLabel(order, products)}の商品が完成済みになります. バリスタ係がバリスタページから完成にすることを推奨します.`,
            onOk: () => {
                for (const stockRef of order.stocksRef) {
                    const stock = stocks.find(s => s.id === stockRef.id);

                    if (stock && (stock.status === 'idle' || stock.status === 'working')) {
                        dispatch(updateStockStatus({shopId, stock, baristaId: 0, status: "completed"}))
                            .catch(e => toast.error(e));
                    }
                }
            }
        })
    }

    return (
        !auth.loading ?
            <React.Fragment>
                {isMobile ?
                    <MobileCashierPage unreceivedOrders={unreceivedOrders} receivedOrders={receivedOrders}
                                       products={products} stocks={stocks}
                                       onClickDelete={handleDeleteOrder} onClickReceive={handleReceiveOrder} onClickUnreceive={handleUnreceiveOrder}
                                       onClickComplete={handleCompleteOrder} onClickAllComplete={handleAllCompleteOrder} onReceiveIndividual={handleReceiveIndividual}/>
                    :
                    <Stack direction={'row'} spacing={4} sx={{padding: "30px 30px"}}
                           alignItems={'flex-start'}>
                        <Stack spacing={4} minWidth={"500px"}>
                            <NeumoContainer key={"order-form-container"}>
                                <Stack direction={"row"} spacing={1} justifyContent={"space-between"}>
                                    <ProductCounter products={products}
                                                    productAmount={productAmount}
                                                    onChangeAmount={onChangeAmount}/>
                                    <Stack justifyContent={"space-between"} alignItems={"stretch"} minWidth={"200px"}>
                                        <SubTotal productAmount={productAmount}
                                                  products={products}
                                                  onClickButton={onOrderAddClicked}/>
                                    </Stack>
                                </Stack>
                            </NeumoContainer>
                            <NeumoContainer>
                                <Heading>
                                    商品の状態
                                </Heading>
                                <StockTable stocks={stocks} products={products}/>
                            </NeumoContainer>
                            <NeumoContainer key={"shop-manager-container"}>
                                <ShopManager/>
                            </NeumoContainer>
                        </Stack>
                        <Stack direction={isSmall ? "column" : "row"} spacing={4}
                               alignItems={isSmall ? "stretch" : 'flex-start'} width={"100%"}>
                            {unreceivedOrders.length > 0 &&
                                <NeumoContainer>
                                    <Heading>
                                        注文
                                    </Heading>
                                    <MotionList layoutId={"order-list"}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', gap: '1rem',
                                                }}>
                                        {unreceivedOrders.map(o =>
                                            <MotionListItem key={o.id}>
                                                <UnreceivedOrderItem order={o}
                                                                     products={products}
                                                                     stocks={stocks}
                                                                     onClickDelete={handleDeleteOrder}
                                                                     onClickReceive={handleReceiveOrder}
                                                                     onClickComplete={handleCompleteOrder}
                                                                     onClickAllComplete={handleAllCompleteOrder}
                                                                     onReceiveIndividual={handleReceiveIndividual}/>
                                            </MotionListItem>
                                        )}
                                    </MotionList>
                                </NeumoContainer>
                            }
                            {receivedOrders.length > 0 &&
                                <NeumoContainer>
                                    <Heading>
                                        受取済み注文
                                    </Heading>
                                    <ReceivedOrderList receivedOrders={receivedOrders}
                                                       onUnreceiveOrder={handleUnreceiveOrder}/>
                                </NeumoContainer>
                            }
                        </Stack>
                    </Stack>
                }
                <Dialog open={dialog.open}
                        onClose={closeDialog}
                        aria-labelledby="order-delete-alert-dialog"
                        aria-describedby="check-order-delete-alert">
                    <DialogTitle id={"order-delete-alert-title"}>
                        {dialog.title}
                    </DialogTitle>
                    {dialog.description.length !== 0 &&
                        <DialogContent>
                            <DialogContentText id="delete-dialog-description">
                                {dialog.description}
                            </DialogContentText>
                        </DialogContent>
                    }
                    <DialogActions>
                        <Button onClick={closeDialog}>キャンセル</Button>
                        <Button onClick={() => {
                            dialog.onOk();
                            closeDialog();
                        }} autoFocus>
                            OK
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

const MobileCashierPage = (props: {
    unreceivedOrders: Order[],
    receivedOrders: Order[],
    products: Product[],
    stocks: Stock[],
    onClickDelete: (order: Order) => void,
    onClickReceive: (order: Order) => void,
    onClickUnreceive: (order: Order) => void,
    onClickComplete: (order: Order, productStatusKey: string) => void,
    onClickAllComplete: (order: Order) => void,
    onReceiveIndividual: (order: Order, productStatusKey: string) => void,
}) => {
    const {unreceivedOrders, receivedOrders, onReceiveIndividual, onClickReceive, onClickUnreceive, onClickDelete, onClickComplete, onClickAllComplete, stocks, products} = props;

    return <Stack spacing={2} sx={{padding: "20px 10px"}}>
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
                                                 stocks={stocks}
                                                 onClickDelete={onClickDelete}
                                                 onClickReceive={onClickReceive}
                                                 onReceiveIndividual={onReceiveIndividual}
                                                 onClickComplete={onClickComplete}
                                                 onClickAllComplete={onClickAllComplete}/>
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
                    <ReceivedOrderList receivedOrders={receivedOrders} onUnreceiveOrder={onClickUnreceive}/>
                </div>
            </div>
        </MotionList>
    </Stack>;
}

export default AdminCashierPage;
