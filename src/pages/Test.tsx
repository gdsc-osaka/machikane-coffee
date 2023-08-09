import {useSelector} from "react-redux";
import {fetchShops, selectAllShops, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import React, {useEffect, useState} from "react";
import {useAppDispatch} from "../modules/redux/store";
import {Card, Divider, TextField, Typography} from "@mui/material";

export const TestPage = () => {
    return <TestShop/>
}

const TestShop = () => {
    const dispatch = useAppDispatch();

    const shops = useSelector(selectAllShops);
    const shopStatus = useSelector(selectShopStatus);

    useEffect(() => {
        if (shopStatus == "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    const [name, setName] = useState('')


    return <Card>
        <Typography variant="h3">
            店リスト
        </Typography>
        {shops.map(shop => `Shop: ${shop.id}, ${shop.last_active_time.toDate().toLocaleDateString()}, ${shop.status}, ${shop.display_name}`)}
        <Divider/>
        <Typography variant="h3">
            店を追加
        </Typography>
        <TextField id="outlined-basic" label="Outlined" value={name} onChange={e => setName(e.target.value)}/>
    </Card>
}