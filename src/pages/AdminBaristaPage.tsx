import {Button, CircularProgress, IconButton, Stack, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import React, {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../modules/redux/store";
import {selectShopById, selectShopStatus, selectShopUnsubscribe} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {BaristaMap, ShopForAdd} from "../modules/redux/shop/shopTypes";
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import UndoRoundedIcon from '@mui/icons-material/UndoRounded';
import StickyNote from "../components/StickyNote";
import {selectAllProducts, selectProductStatus} from "../modules/redux/product/productsSlice";
import {MotionList, MotionListItem} from "src/components/motion/motionList";
import {Product} from "../modules/redux/product/productTypes";
import {useAuth} from "../AuthGuard";
import toast from "react-hot-toast";
import {fetchProducts} from "../modules/redux/product/productsThunk";
import {streamShop, updateShop} from "../modules/redux/shop/shopsThunk";
import {selectStockStatus, selectStocksForBarista} from "../modules/redux/stock/stockSelectors";
import {streamStocks, updateStockStatus} from "../modules/redux/stock/stocksThunk";
import {Stock, StockStatus} from "../modules/redux/stock/stockTypes";
import styled from "styled-components";

const AdminBaristaPage = () => {
    const [selectedId, setSelectedId] = useState(0);

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const params = useParams();

    const shopId = params.shopId ?? '';
    const shopStatus = useAppSelector(selectShopStatus);
    const shop = useAppSelector(state => selectShopById(state, shopId));
    const baristas = shop?.baristas ?? {};
    const baristaIds = shop === undefined ? [] : Object.keys(shop.baristas).map((e) => parseInt(e));

    const stockStatus = useAppSelector(state => selectStockStatus(state, shopId));
    const stocks = useAppSelector(state => selectStocksForBarista(state, shopId, selectedId));

    const productStatus = useAppSelector(state => selectProductStatus(state, shopId))
    const products = useAppSelector(state => selectAllProducts(state, shopId));

    const shopUnsubscribe = useAppSelector(selectShopUnsubscribe);

    // const current_time =  Number(Math.floor(useDate(1).getTime()));

    // データを取得
    useEffect(() => {
        if (shopStatus === "idle") {
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus, shopId]);

    useEffect(() => {
        if (stockStatus === "idle") {
            const unsub = streamStocks(shopId, {dispatch})

            return () => {
                unsub()
            }
        }
        // empty array でないと unsub() が2回呼ばれる
    }, []);

    useEffect(() => {
        if (productStatus === "idle") {
            dispatch(fetchProducts(shopId));
        }
    }, [productStatus, dispatch, shopId]);

    // windowが閉じられたとき or refreshされたとき, selectedIdをinactiveに戻す & unsubscribe
    useEffect(() => {
        window.addEventListener("beforeunload", (_) => {
            // ISSUE#21
            // if (shop !== undefined) {
            //     console.log("updateshop")
            //     dispatch(updateShop({shopId, rawShop: {...shop, baristas: {...shop.baristas, [selectedId]: "inactive"}}}));
            // }

            if (shopUnsubscribe !== null) {
                shopUnsubscribe();
            }
        })
    }, [])

    // バリスタIDの変更
    const handleBaristaId = (
        newId: number | null | undefined
    ) => {
        const oldId = selectedId;

        if (newId !== null && newId !== undefined &&
            baristas[newId] === "active" && selectedId !== newId) {
            toast(`${newId}番は他に担当者がいます`, {
                icon: '\u26A0'
            });
        }

        if (shop !== undefined && oldId !== newId) {
            let newBaristas: BaristaMap;

            if (newId !== null && newId !== undefined) {
                // idを最初に設定したときはoldIdが0なので場合分けする
                newBaristas = oldId > 0 ? {
                    ...shop.baristas,
                    [newId]: "active",
                    [oldId]: "inactive"
                } : {...shop.baristas, [newId]: "active"};
                setSelectedId(newId);
            } else {
                // 選択中のボタンを押したとき
                newBaristas = {...shop.baristas, [oldId]: "inactive"};
                setSelectedId(0);
            }

            const rawShop: ShopForAdd = {...shop, baristas: newBaristas};
            dispatch(updateShop({shopId, rawShop}));
        }
    };

    // それぞれのボタンを押したとき
    const handleStockStatus = (stock: Stock, status: StockStatus) => {
        dispatch(updateStockStatus({shopId, stock, status, baristaId: selectedId}));
    }


    if (shop === undefined || auth.loading) {
        return <CircularProgress/>
    } else {
        return <Stack spacing={2} sx={{padding: "25px 10px"}}>
            <Stack spacing={1}>
                <ToggleButtonGroup color={"primary"} fullWidth={true} value={selectedId} exclusive
                                   onChange={(e, id) => handleBaristaId(id)}>
                    {baristaIds.map(id =>
                        // TODO disabled条件を付けるか否か? <ToggleButton value={id} disabled={baristas[id] === "active" && selectedId !== id}>
                        <ToggleButton value={id} key={id}>
                            {selectedId === id ? <CheckRoundedIcon style={{marginRight: "0.5rem"}}/> : <React.Fragment/>}
                            {id}番
                        </ToggleButton>)}
                </ToggleButtonGroup>
                <Typography variant={"body2"} textAlign={"right"} alignSelf={"stretch"}>
                    担当を離れるときは選択を解除してください
                </Typography>
            </Stack>
            {/*<Typography variant={"h4"} fontWeight={"bold"} sx={{padding: "5px 0"}}>*/}
            {/*    未完成の注文一覧*/}
            {/*</Typography>*/}
            <MotionList layoutId={"barista-order-list"} style={{
                display: 'grid',
                gridTemplateColumns: "1fr",
                gap: '1rem'
            }}>
                {stocks.map(stock => {
                    return <MotionListItem key={stock.id}>
                        <BaristaStockItem stock={stock}
                                          products={products}
                                          onChangeStatus={handleStockStatus}/>
                    </MotionListItem>
                })}
            </MotionList>
        </Stack>
    }
}

const BaristaStockItem = (props: {
    stock: Stock,
    products: Product[],
    onChangeStatus: (stock: Stock, status: StockStatus) => void,
}) => {
    const {stock, products, onChangeStatus} = props;

    const isWorking = stock.status === "working";
    const product = products.find(p => p.id === stock.product_id);

    if (product === undefined) {
        return <></>;
    }

    return <StickyNote variant={isWorking ? "surface-variant" : "surface"} direction={"row"} sx={{justifyContent: "space-between", padding: "0.375rem 1.5rem 0.375rem 0.5rem"}}>
        <Stack direction={"row"} alignItems={"center"} spacing={1}>
            <Icon alt={"product-icon"} src={product.thumbnail_url}/>
            <Typography variant={"body2"}>
                {product.shorter_name}
            </Typography>
        </Stack>
        <Stack direction={"row"} spacing={1}>
            {isWorking ?
                <>
                    {/*<IconButton onClick={() => onChangeStatus(stock, "idle")} key={"undo"}>*/}
                    {/*    <UndoRoundedIcon/>*/}
                    {/*</IconButton>*/}
                    {/*<IconButton onClick={() => onChangeStatus(stock, "completed")} key={"check"}>*/}
                    {/*    <CheckRoundedIcon/>*/}
                    {/*</IconButton>*/}
                    <Button variant={"outlined"} onClick={() => onChangeStatus(stock, "idle")} key={"undo"}>
                        戻す
                    </Button>
                    <Button variant={"outlined"} onClick={() => onChangeStatus(stock, "completed")} key={"check"}>
                        完成
                    </Button>
                </>
                :
                <Button variant={"contained"} onClick={() => onChangeStatus(stock, "working")}>
                    作成
                </Button>
            }

        </Stack>
    </StickyNote>;
}

const Icon = styled.img`
  border-radius: 10px;
  width: 50px
`

export default AdminBaristaPage