import {useSelector} from "react-redux";
import {
    addShop, changeShopStatus,
    fetchShops,
    selectAllShops, selectShopById,
    selectShopError,
    selectShopStatus,
    updateShop
} from "../modules/redux/shop/shopsSlice";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {
    Button,
    Card, Checkbox,
    Divider,
    FormControl, FormControlLabel,
    List,
    ListItem, Paper,
    Radio, RadioGroup,
    TextField,
    Typography
} from "@mui/material";
import {
    addProduct,
    fetchProducts,
    selectAllProduct,
    selectProductStatus,
    updateProduct
} from "../modules/redux/product/productsSlice";
import {useParams} from "react-router-dom";
import {ProductAmount, RawOrder} from "../modules/redux/order/types";
import {
    addOrder,
    fetchOrders,
    selectAllOrders, selectOrderById,
    selectOrderStatus,
    updateOrder
} from "../modules/redux/order/ordersSlice";

export const TestPage = () => {
    return <div>
        <TestShop/>
        <Divider/>
        <TestProduct/>
        <Divider/>
        <TestOrder/>
    </div>
}

const TestShop = () => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState('')
    const [id, setId] = useState('')
    const [status, setStatus] = useState("active");

    const shops = useSelector(selectAllShops);
    const shopStatus = useSelector(selectShopStatus);

    useEffect(() => {
        if (shopStatus == "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);


    const onAddShopClicked = async () => {
        await dispatch(addShop({shopId: id, rawShop: {display_name: name}}))
    }
    const onUpdateShopClicked = async () => {
        await dispatch(updateShop({shopId: id, rawShop: {display_name: name}}))
    }

    const onChangeShopStatusClicked = async () => {
        if (status == "active" || status == "pause_ordering") {
            await dispatch(changeShopStatus({shopId: id, status: status}))
        }
    }

    return <Paper>
        <Typography variant="h6">
            店リスト fetchShops()
        </Typography>
        <List>
            {shops.map(shop => <ListItem>
                {shop.id}, {shop.display_name}, {shop.last_active_time.toDate().toLocaleString()}, {shop.status}
            </ListItem>)}
        </List>
        <Divider/>
        <Typography variant="h6">
            店を追加 addShop()
        </Typography>
        <List>
            <ListItem>
                <TextField id="outlined-basic" label="ID" value={id} onChange={e => setId(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="店名" value={name} onChange={e => setName(e.target.value)}/>
            </ListItem>
            <ListItem>
                <Button onClick={onAddShopClicked}>追加</Button>
            </ListItem>
        </List>
        <Divider/>
        <Typography variant="h6">
            店を更新 updateShop()
        </Typography>
        <List>
            <ListItem>
                <TextField id="outlined-basic" label="ID" value={id} onChange={e => setId(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="新しい店名" value={name} onChange={e => setName(e.target.value)}/>
            </ListItem>
            <ListItem>
                <Button onClick={onUpdateShopClicked}>更新</Button>
            </ListItem>
        </List>
        <Divider/>
        <Typography variant="h6">
            店ステータスを変更 changeShopStatus()
        </Typography>
        <List>
            <ListItem>
                <TextField id="outlined-basic" label="ID" value={id} onChange={e => setId(e.target.value)}/>
            </ListItem>
            <ListItem>
                <FormControl>
                    <RadioGroup defaultValue={status} onChange={e => setStatus(e.target.value)}>
                        <FormControlLabel value="active" control={<Radio />} label="active" />
                        <FormControlLabel value="pause_ordering" control={<Radio />} label="pause_ordering" />
                    </RadioGroup>
                </FormControl>
            </ListItem>
            <ListItem>
                <Button onClick={onChangeShopStatusClicked}>変更</Button>
            </ListItem>
        </List>
    </Paper>
}

const TestProduct = () => {
    const params = useParams();
    const shopId = params.shopId ?? '';
    const [productId, setProductId] = useState('');
    const [name, setName] = useState('');
    const [span, setSpan] = useState('');

    const dispatch = useAppDispatch();

    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus)

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    const onAddProductClicked = async () => {
        await dispatch(addProduct({shopId: shopId, product: {id: productId, span: Number(span), display_name: name}}));
    }

    const onUpdateProductClicked = async () => {
        await dispatch(updateProduct({shopId: shopId, product: {id: productId, span: Number(span), display_name: name}}));
    }

    return <Paper>
        productStatus: {productStatus}
        <Typography variant="h6">
            商品リスト
        </Typography>
        <List>
            {products.map(product => <ListItem>
                {product.id}, {product.display_name}, {product.span}
            </ListItem>)}
        </List>
        <Divider/>
        <Typography variant="h6">
            商品を追加
        </Typography>
        <List>
            <ListItem>
                <TextField id="outlined-basic" label="商品ID" value={productId} onChange={e => setProductId(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="名前" value={name} onChange={e => setName(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="完成にかかる時間" value={span} onChange={e => setSpan(e.target.value)}/>
            </ListItem>
            <ListItem>
                <Button onClick={onAddProductClicked}>追加</Button>
            </ListItem>
        </List>
        <Divider/>
        <Typography variant="h6">
            店を更新
        </Typography>
        <List>
            <ListItem>
                <TextField id="outlined-basic" label="商品ID" value={productId} onChange={e => setProductId(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="名前" value={name} onChange={e => setName(e.target.value)}/>
            </ListItem>
            <ListItem>
                <TextField id="outlined-basic" label="完成にかかる時間(秒)" value={span} onChange={e => setSpan(e.target.value)}/>
            </ListItem>
            <ListItem>
                <Button onClick={onUpdateProductClicked}>更新</Button>
            </ListItem>
        </List>
    </Paper>
}

const TestOrder = () => {
    const params = useParams();
    const shopId = params.shopId ?? '';

    const [isStudent, setIsStudent] = useState(false);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});
    const [productId, setProductId] = useState('');
    const [amount, setAmount] = useState('');
    const [orderId, setOrderId] = useState('');
    const [completed, setCompleted] = useState(false);
    const [received, setReceived] = useState(false);

    const dispatch = useAppDispatch();

    const orders = useSelector(selectAllOrders);
    const orderStatus = useSelector(selectOrderStatus)
    const selectedOrder = useSelector((state: RootState) => selectOrderById(state, orderId));

    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(fetchOrders(shopId));
        }
    }, [dispatch, orderStatus]);

    const onAddProdAmount = () => {
        setProductAmount({...productAmount, [productId]: Number(amount)});
        setProductId('');
        setAmount('');
    }

    const onAddOrderClicked = async () => {
        await dispatch(addOrder({shopId: shopId, rawOrder: {is_student: isStudent, product_amount: productAmount}}));
    }

    const onUpdateOrderClicked = async () => {
        // await dispatch(updateOrder({shopId: shopId, newOrder: {...selectedOrder, }}))
    }

    return <Paper>
        orderStatus: {orderStatus}
        <Typography variant="h6">
            注文リスト
        </Typography>
        <List>
            {orders.map(order => <ListItem>
                {`id: ${order.id}}, ` +
                    `index: ${order.index}, ` +
                    `created_at: ${order.created_at.toDate().toLocaleString()}, ` +
                    `completed_at: ${order.complete_at.toDate().toLocaleString()}, ` +
                    `received: ${order.received}, ` +
                    `completed: ${order.completed}, ` +
                    // @ts-ignore
                    `order_statuses: {${order.order_statuses.map(os => Object.keys(os).map(key => `${key}: ${os[key]}, `))}}, ` +
                    `product_amount: {${Object.keys(order.product_amount).map(key => `${key}: ${order.product_amount[key]}, `)}}, ` +
                    `is_student: ${order.is_student}`}
            </ListItem>)}
        </List>
        <Divider/>
        <Typography variant="h6">
            注文を追加
        </Typography>
        <List>
            学生かどうか
            <Checkbox value={isStudent} onChange={e => setIsStudent(e.target.checked)}/>
            <Card>
                <TextField id="outlined-basic" label="商品ID" value={productId} onChange={e => setProductId(e.target.value)}/>
                <TextField id="outlined-basic" label="数量" value={amount} onChange={e => setAmount(e.target.value)}/>
                <Button onClick={onAddProdAmount}>追加</Button>
            </Card>
            {Object.keys(productAmount).map(key => `${key}: ${productAmount[key]}, `)}
            <ListItem>
                <Button onClick={onAddOrderClicked}>決定</Button>
            </ListItem>
        </List>
    </Paper>
}