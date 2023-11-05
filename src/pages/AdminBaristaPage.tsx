import {Button, CircularProgress, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import React, {useState} from "react";
import {useAppDispatch, useAppSelector} from "../modules/redux/store";
import {selectShopById} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {BaristaMap, ShopForAdd} from "../modules/redux/shop/shopTypes";
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import StickyNote from "../components/StickyNote";
import {selectAllProducts} from "../modules/redux/product/productsSlice";
import {MotionList, MotionListItem} from "src/components/motion/motionList";
import {Product} from "../modules/redux/product/productTypes";
import {useAuth} from "../AuthGuard";
import toast from "react-hot-toast";
import {updateShop} from "../modules/redux/shop/shopsThunk";
import {selectStocksForBarista} from "../modules/redux/stock/stockSelectors";
import {updateStockStatus} from "../modules/redux/stock/stocksThunk";
import {Stock, StockStatus} from "../modules/redux/stock/stockTypes";
import styled from "styled-components";
import {fullToHalf} from "../modules/util/stringUtils";
import {useDate} from "../modules/hooks/useDate";
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {CaptionCard} from "../components/OutlineCard";

const AdminBaristaPage = () => {
    const [selectedId, setSelectedId] = useState(0);

    const dispatch = useAppDispatch();
    const auth = useAuth();
    const params = useParams();

    const shopId = params.shopId ?? '';
    const shop = useAppSelector(state => selectShopById(state, shopId));
    const baristas = shop?.baristas ?? {};
    const baristaIds = shop === undefined ? [] : Object.keys(shop.baristas).map((e) => parseInt(e));

    const stocks = useAppSelector(state => selectStocksForBarista(state, shopId, selectedId));

    const products = useAppSelector(state => selectAllProducts(state, shopId));

    // const current_time =  Number(Math.floor(useDate(1).getTime()));

    // データを取得
    // useEffect(() => {
    //     let unsubProduct = () => {}, unsubStock = () => {}, unsubShop = () => {};
    //
    //     if (productStatus === 'idle') unsubProduct = streamProducts(shopId, {dispatch})
    //     if (stockStatus === 'idle') unsubStock = streamStocks(shopId, {dispatch})
    //     if (shopStatus === 'idle') unsubShop = streamShop(shopId, {dispatch})
    //
    //     return () => {
    //         unsubProduct();
    //         unsubStock();
    //         unsubShop();
    //     }
    // }, [])
    useStreamEffect(shopId, "product", "stock", "shop");

    // windowが閉じられたとき or refreshされたとき, selectedIdをinactiveに戻す & unsubscribe
    // useEffect(() => {
    //     window.addEventListener("beforeunload", (_) => {
    //         // ISSUE#21
    //         if (shop !== undefined) {
    //             console.log("updateshop")
    //             dispatch(updateShop({shopId, rawShop: {...shop, baristas: {...shop.baristas, [selectedId]: "inactive"}}}));
    //         }
    //     })
    // }, [])

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
        dispatch(updateStockStatus({shopId, stock, status, baristaId: selectedId})).catch(e => toast.error(e));
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
                {stocks.length === 0 &&
                    <MotionListItem>
                        <CaptionCard>
                            {selectedId === 0 ? "番号を選択してください" : "注文がありません"}
                        </CaptionCard>
                    </MotionListItem>
                }
                {selectedId !== 0 && stocks.map(stock => {
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

    const now = useDate();

    const isWorking = stock.status === "working";
    const product = products.find(p => p.id === stock.product_id);
    const splittedOrderId = stock.orderRef.id.split('_'); /* orderのidには末尾に "_番号" の形で注文番号が付加されている */

    if (product === undefined) {
        return <></>;
    }

    const secSpentToMake = (now - stock.start_working_at.toMillis()) / 1000; /* 作成し始めてから何秒経過したか */
    const elapsedMin = Math.floor(secSpentToMake / 60);
    const elapsedSec = Math.floor(secSpentToMake % 60);

    return <StickyNote variant={isWorking ? "surface-variant" : "surface"} direction={"row"} sx={{justifyContent: "space-between", padding: "0.375rem 1.5rem 0.375rem 0.5rem"}}>
        <Stack direction={"row"} alignItems={"center"} spacing={1}>
            <Typography variant={"body2"} fontWeight={"bold"} width={"20px"} textAlign={"center"}>
                {splittedOrderId.length > 1 && splittedOrderId[splittedOrderId.length - 1]}
            </Typography>
            <Divider orientation={"vertical"} sx={{height: "100%"}}/>
            <Icon alt={"product-icon"} src={product.thumbnail_url}/>
            <Typography variant={"body2"}>
                {fullToHalf(product.display_name)}
            </Typography>
            <Typography variant={"body2"} sx={{color: (theme) => theme.typography.caption.color}}>
                {stock.status === "working" &&
                    String(elapsedMin > 0 ? elapsedMin : 0).padStart(2, "0")
                    + ":" + String(elapsedSec > 0  ? elapsedSec : 0).padStart(2, "0")}
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
                    <Button variant={"contained"} onClick={() => onChangeStatus(stock, "completed")} key={"check"}>
                        完成
                    </Button>
                </>
                :
                <Button variant={"outlined"} onClick={() => onChangeStatus(stock, "working")}>
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