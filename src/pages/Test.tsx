import {useSelector} from "react-redux";
import {
    addShop,
    changeShopStatus,
    fetchShops,
    selectAllShops,
    selectShopStatus,
    updateShop,
} from "../modules/redux/shop/shopsSlice";
import React, {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {
    Button,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    List,
    ListItem,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from "@mui/material";
import {
    addProduct,
    fetchProducts,
    selectAllProduct,
    selectProductStatus,
    updateProduct,
} from "../modules/redux/product/productsSlice";
import {useParams} from "react-router-dom";
import {Order, ProductAmount} from "../modules/redux/order/types";
import {
    addOrder,
    fetchOrders,
    selectAllOrders,
    selectOrderById,
    selectOrderStatus,
    updateOrder,
} from "../modules/redux/order/ordersSlice";
import JsonFormatter from "react-json-formatter";
import {getFunctions, httpsCallable} from "firebase/functions";
import {initializeApp} from "firebase/app";

const jsonStyle = {
    propertyStyle: {color: "#9cdcfe"},
    stringStyle: {color: "#ce9178"},
    numberStyle: {color: "#b5cea8"},
    braceStyle: {color: "#ffd700"},
    bracketStyle: {color: "#da70d6"},
    booleanStyle: {color: "#569cd6"},
};

export const TestPage = () => {
    return (
        <div style={{padding: 20}}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TestShop/>
                </Grid>
                <Grid item xs={6}>
                    <TestProduct/>
                </Grid>
                <Grid item xs={6}>
                    <TestOrder/>
                </Grid>
            </Grid>
        </div>
    );
};

const TestShop = () => {
    const dispatch = useAppDispatch();
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [status, setStatus] = useState("active");

    const shops = useSelector(selectAllShops);
    const shopStatus = useSelector(selectShopStatus);

    useEffect(() => {
        if (shopStatus == "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    const firebaseConfig = {
        apiKey: "AIzaSyCFgXdiuj5NvgS9AVVuc9GMHiW8XnkWujY",
        authDomain: "machikane-coffee.firebaseapp.com",
        projectId: "machikane-coffee",
        storageBucket: "machikane-coffee.appspot.com",
        messagingSenderId: "838446105130",
        appId: "1:838446105130:web:681b58b1ce980aaa83b953",
        measurementId: "G-DP4B9FYBBR",
    };

    // Initialize Firebase
    initializeApp(firebaseConfig);

    useEffect(() => {
        // HTTP request
        const functions = getFunctions();
        const setAdminClaim = httpsCallable(functions, "setAdminClaim");
        const uid = "B9HB7lHbbzeWaRyMj0SSaEsJqkK2";

        setAdminClaim({uid: uid}).then((result) => {
            console.log("setAdminClaim");
            console.log(functions);
            console.log(setAdminClaim.name);
            console.log(result);
        }).catch((err) => {
            console.log(err);
        });
    }, []);

    const onAddShopClicked = async () => {
        await dispatch(
            addShop({
                shopId: id,
                rawShop: {display_name: name, baristas: {}, emg_message: ""},
            })
        );
    };
    const onUpdateShopClicked = async () => {
        await dispatch(
            updateShop({
                shopId: id,
                rawShop: {display_name: name, baristas: {}, emg_message: ""},
            })
        );
    };

    const onChangeShopStatusClicked = async () => {
        if (status == "active" || status == "pause_ordering") {
            await dispatch(changeShopStatus({shopId: id, status: status}));
        }
    };

    return (
        <Paper>
            <div style={{padding: 15}}>
                <Typography variant="h6">店リスト fetchShops()</Typography>
                <List>
                    {shops.map((shop) => (
                        <ListItem>
                            <JsonFormatter
                                json={JSON.stringify(shop)}
                                tabWith={4}
                                jsonStyle={jsonStyle}
                            />
                        </ListItem>
                    ))}
                </List>
                <Divider/>
                <Typography variant="h6">店を追加 addShop()</Typography>
                <List>
                    <ListItem>
                        <TextField
                            id="shop-id"
                            label="ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="shop-name"
                            label="店名"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <Button onClick={onAddShopClicked}>追加</Button>
                    </ListItem>
                </List>
                <Divider/>
                <Typography variant="h6">店を更新 updateShop()</Typography>
                <List>
                    <ListItem>
                        <TextField
                            id="shop-id"
                            label="ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="shop-name"
                            label="新しい店名"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
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
                        <TextField
                            id="shop-id"
                            label="ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <FormControl>
                            <RadioGroup
                                defaultValue={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <FormControlLabel
                                    value="active"
                                    control={<Radio/>}
                                    label="active"
                                />
                                <FormControlLabel
                                    value="pause_ordering"
                                    control={<Radio/>}
                                    label="pause_ordering"
                                />
                            </RadioGroup>
                        </FormControl>
                    </ListItem>
                    <ListItem>
                        <Button onClick={onChangeShopStatusClicked}>変更</Button>
                    </ListItem>
                </List>
            </div>
        </Paper>
    );
};

const TestProduct = () => {
    const params = useParams();
    const shopId = params.shopId ?? "";
    const [productId, setProductId] = useState("");
    const [name, setName] = useState("");
    const [span, setSpan] = useState("");
    const [price, setPrice] = useState("0");
    const [shorterName, setShorterName] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState<File | undefined>();

    const dispatch = useAppDispatch();

    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    const onAddProductClicked = async () => {
        if (thumbnailFile) {
            await dispatch(
                addProduct({
                    shopId: shopId,
                    rawProduct: {
                        id: productId,
                        span: Number(span),
                        display_name: name,
                        price: Number(price),
                        shorter_name: shorterName,
                    },
                    thumbnailFile: thumbnailFile,
                })
            );
        }
    };

    const onUpdateProductClicked = async () => {
        await dispatch(
            updateProduct({
                shopId: shopId,
                rawProduct: {
                    id: productId,
                    span: Number(span),
                    display_name: name,
                    price: Number(price),
                    shorter_name: shorterName,
                },
                thumbnailFile: thumbnailFile,
            })
        );
    };

    const onChangeThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            setThumbnailFile(files[0]);
        }
    };

    return (
        <Paper>
            <div style={{padding: 15}}>
                <Typography variant="h6">商品リスト</Typography>
                productStatus: {productStatus}
                <List>
                    {products.map((product) => (
                        <ListItem>
                            <JsonFormatter
                                json={JSON.stringify(product)}
                                tabWith={4}
                                jsonStyle={jsonStyle}
                            />
                        </ListItem>
                    ))}
                </List>
                <Divider/>
                <Typography variant="h6">商品を追加</Typography>
                <List>
                    <ListItem>
                        <TextField
                            id="product-id"
                            label="商品ID"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="product-name"
                            label="名前"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="span"
                            label="完成にかかる時間"
                            value={span}
                            onChange={(e) => setSpan(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="price"
                            label="値段"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="shorter-name"
                            label="略記"
                            value={shorterName}
                            onChange={(e) => setShorterName(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <input
                            name="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={onChangeThumbnail}
                        />
                    </ListItem>
                    <ListItem>
                        <Button onClick={onAddProductClicked}>追加</Button>
                    </ListItem>
                </List>
                <Divider/>
                <Typography variant="h6">商品を更新</Typography>
                <List>
                    <ListItem>
                        <TextField
                            id="product-id"
                            label="商品ID"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="product-name"
                            label="名前"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="span"
                            label="完成にかかる時間(秒)"
                            value={span}
                            onChange={(e) => setSpan(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <TextField
                            id="price"
                            label="値段"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </ListItem>
                    <ListItem>
                        <input
                            name="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={onChangeThumbnail}
                        />
                    </ListItem>
                    <ListItem>
                        <Button onClick={onUpdateProductClicked}>更新</Button>
                    </ListItem>
                </List>
            </div>
        </Paper>
    );
};

const TestOrder = () => {
    const params = useParams();
    const shopId = params.shopId ?? "";

    const [isStudent, setIsStudent] = useState(false);
    const [productAmount, setProductAmount] = useState<ProductAmount>({});
    const [productId, setProductId] = useState("");
    const [amount, setAmount] = useState("");
    const [orderId, setOrderId] = useState("");

    const dispatch = useAppDispatch();

    const orders = useSelector(selectAllOrders);
    const orderStatus = useSelector(selectOrderStatus);
    const selectedOrder = useSelector((state: RootState) =>
        selectOrderById(state, orderId)
    );

    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(fetchOrders(shopId));
        }
    }, [dispatch, orderStatus]);

    const onAddProdAmount = () => {
        setProductAmount({...productAmount, [productId]: Number(amount)});
        setProductId("");
        setAmount("");
    };

    const onAddOrderClicked = async () => {
        await dispatch(
            addOrder({
                shopId: shopId,
                rawOrder: {
                    is_student: isStudent,
                    product_amount: productAmount,
                    status: "idle",
                },
            })
        );
        setProductAmount({});
    };

    const onUpdateOrderClicked = async (order: Order) => {
        if (order != undefined) {
            await dispatch(updateOrder({shopId: shopId, newOrder: order}));
        }
    };

    return (
        <Paper>
            <div style={{margin: 15}}>
                <Typography variant="h6">注文リスト</Typography>
                orderStatus: {orderStatus}
                <List>
                    {orders.map((order) => (
                        <ListItem>
                            <JsonFormatter
                                json={JSON.stringify(order)}
                                tabWith={4}
                                jsonStyle={jsonStyle}
                            />
                        </ListItem>
                    ))}
                </List>
                <Divider/>
                <Typography variant="h6">注文を追加</Typography>
                <List>
                    学生かどうか
                    <Checkbox
                        value={isStudent}
                        onChange={(e) => setIsStudent(e.target.checked)}
                    />
                    <div>
                        <TextField
                            id="product-id"
                            label="商品ID"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                        <TextField
                            id="amount"
                            label="数量"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button onClick={onAddProdAmount}>追加</Button>
                    </div>
                    {Object.keys(productAmount).map(
                        (key) => `${key}: ${productAmount[key]}, `
                    )}
                    <ListItem>
                        <Button onClick={onAddOrderClicked}>決定</Button>
                    </ListItem>
                </List>
                <Typography variant="h6">注文を更新</Typography>
                <List>
                    <ListItem>
                        <TextField
                            label={"注文ID"}
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                        />
                    </ListItem>
                    {selectedOrder != undefined ? (
                        <React.Fragment>
                            <ListItem>
                                completed:{" "}
                                <Checkbox
                                    checked={selectedOrder.completed}
                                    onChange={(e) =>
                                        onUpdateOrderClicked({
                                            ...selectedOrder,
                                            completed: e.target.checked,
                                        })
                                    }
                                />
                                received:{" "}
                                <Checkbox
                                    checked={selectedOrder.received}
                                    onChange={(e) =>
                                        onUpdateOrderClicked({
                                            ...selectedOrder,
                                            received: e.target.checked,
                                        })
                                    }
                                />
                            </ListItem>
                            {Object.keys(selectedOrder.order_statuses).map((key) => {
                                const status = selectedOrder.order_statuses[key];
                                return (
                                    <ListItem>
                                        {key} - completed:{" "}
                                        <Checkbox
                                            checked={status.completed}
                                            onChange={(e) =>
                                                onUpdateOrderClicked({
                                                    ...selectedOrder,
                                                    order_statuses:
                                                    // NOTE: [key] にする. key ではない
                                                        {
                                                            ...selectedOrder.order_statuses,
                                                            [key]: {...status, completed: e.target.checked},
                                                        },
                                                })
                                            }
                                        />
                                        received:{" "}
                                        <Checkbox
                                            checked={status.received}
                                            onChange={(e) =>
                                                onUpdateOrderClicked({
                                                    ...selectedOrder,
                                                    order_statuses: {
                                                        ...selectedOrder.order_statuses,
                                                        [key]: {...status, received: e.target.checked},
                                                    },
                                                })
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </React.Fragment>
                    ) : (
                        <div/>
                    )}
                </List>
            </div>
        </Paper>
    );
};
