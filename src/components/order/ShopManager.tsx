import {Column} from "../layout/Column";
import {IconButton, Switch, TextField, Typography} from "@mui/material";
import {Expanded} from "../layout/Expanded";
import {useEffect, useState} from "react";
import {Row} from "../layout/Row";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import { changeShopStatus, fetchShops, selectShopById, selectShopStatus, updateShop } from "../../modules/redux/shop/shopsSlice";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../../modules/redux/store";
import { BaristaMap, RawShop, Shop } from "../../modules/redux/shop/types";

const ShopManager = () => {
    const [emgMsg, setEmgMsg] = useState('');
    const [baristaCount, setBaristaCount] = useState(1);

    const [name, setName] = useState('')
    const [id, setId] = useState('')

    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? '';
    const shopStatus = useSelector(selectShopStatus);
    const shop = useSelector<RootState, Shop | undefined>(state => selectShopById(state, shopId));

    useEffect(() => {
        if (shopStatus == "idle" || shopStatus == "failed") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    // const rawShop = 

    // let f = true;
    // if (f){
    //     console.log(shopId);
    //     console.log(shop);
    //     console.log(shop?.baristas);
    //     console.log(shop?.display_name);
    //     console.log(shopStatus);
    //     f = false;
    // }
    
    // console.log(shop?.baristas);
    // console.log(shop?.display_name);

    const [baristas, setBaristas] = useState<BaristaMap>({});

    // tmp
    // setId("toyonaka");
    const tmpId = "toyonaka";
        
    const handleEmergency = async (value: boolean) => {
        if(value){
            // status
            await dispatch(changeShopStatus({shopId: tmpId, status: "pause_ordering"}))

            // emgMsg
            await dispatch(updateShop({
                shopId: tmpId,
                rawShop: {display_name: name, baristas: baristas, emg_message: emgMsg}
            }))
        }
    }

    const handleBaristaCount = async (diff: number) => {
        const newCount = baristaCount + diff;

        if (newCount > 0) {
            setBaristaCount(newCount);
        }

        // make the copy
        const trueBaristas = Object.assign({}, baristas)

        console.log("trueBarista: " + trueBaristas);
        console.log("trueBarista[1]: " + trueBaristas[1]);
        console.log("baristaCount: " + baristaCount);

        if(diff > 0){
            trueBaristas[baristaCount] = "inactive";
        }else{
            delete trueBaristas[baristaCount];
        }

        setBaristas(trueBaristas);
        
        await dispatch(updateShop({
            shopId: tmpId,
            rawShop: {
                display_name: name, baristas: trueBaristas, emg_message: emgMsg
            }
        }))

        await dispatch(changeShopStatus({shopId: shopId, status: "active"}))
    }

    return <Column>
        <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
            管理
        </Typography>
        <Expanded>
            <Typography variant={"h5"} sx={{fontWeight: "bold"}}>
                提供中止
            </Typography>
            <Switch disabled={emgMsg.length == 0} onChange={e => handleEmergency(e.target.checked)}/>
        </Expanded>
        <TextField id="emg-message" label="メッセージ" variant="outlined" helperText={"入力すると提供中止ボタンが押せます"}
                   value={emgMsg} onChange={e => setEmgMsg(e.target.value)}
                   sx={{width: "100%"}} />
        <Expanded>
            <Typography variant={"h5"} sx={{fontWeight: "bold"}}>
                ドリップ担当者数
            </Typography>
            <Row>
                <IconButton onClick={() => handleBaristaCount(-1)}>
                    <RemoveRoundedIcon/>
                </IconButton>
                {baristaCount}人
                <IconButton onClick={() => handleBaristaCount(1)}>
                    <AddRoundedIcon/>
                </IconButton>
            </Row>
        </Expanded>
    </Column>
}

export default  ShopManager