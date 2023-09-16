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
    const [baristas, setBaristas] = useState<BaristaMap>({1:"inactive"});
    const [lastActiveTime, setLastActiveTime] = useState();

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

    // TODO tmp value so need to change
    // setId("toyonaka");
    const tmpId = "toyonaka";
        
    const handleEmergency = async (value: boolean) => {
        if(value){  // active
            // status
            await dispatch(changeShopStatus({shopId: tmpId, status: "pause_ordering"}))

            // emgMsg
            await dispatch(updateShop({
                shopId: tmpId,
                rawShop: {display_name: name, baristas: baristas, emg_message: emgMsg}
            }))
        }else{  // pause
            // status
            await dispatch(changeShopStatus({shopId: tmpId, status: "active"}))

            // emgMsg
            await dispatch(updateShop({
                shopId: tmpId,
                rawShop: {display_name: name, baristas: baristas, emg_message: ""}
            }))
        }
    }

    const handleBaristaCount = async (diff: number) => {
        const newCount = baristaCount + diff;
        const trueBaristas = Object.assign({}, baristas);   // make the copy

        if(newCount > 0) {
            if(diff > 0){
                // 更新後のbarista数
                console.log("add: "+newCount);
                trueBaristas[newCount] = "inactive";
            }else{
                // 更新前のbarista数
                console.log("del: " + baristaCount);
                delete trueBaristas[baristaCount];
            }

            console.log(newCount);

            setBaristaCount(newCount);
            setBaristas(trueBaristas);

            await dispatch(updateShop({
                shopId: tmpId,
                rawShop: {
                    display_name: name, baristas: trueBaristas, emg_message: emgMsg
                }
            }))
    
            await dispatch(changeShopStatus({shopId: shopId, status: "active"}))
        }
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