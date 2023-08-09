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
import {useAppDispatch} from "../modules/redux/store";
import {
    Button,
    Card,
    Divider,
    FormControl, FormControlLabel,
    List,
    ListItem, Paper,
    Radio, RadioGroup,
    TextField,
    Typography
} from "@mui/material";
import {selectAllProduct} from "../modules/redux/product/productsSlice";

export const TestPage = () => {
    return <TestShop/>
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
    const [shopId, setShopId] = useState('');

    const dispatch = useAppDispatch();

    const products = useSelector(selectAllProduct);
}