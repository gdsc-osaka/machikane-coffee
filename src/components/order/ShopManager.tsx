import {Column} from "../layout/Column";
import {IconButton, Switch, TextField, Typography} from "@mui/material";
import {Expanded} from "../layout/Expanded";
import {useState} from "react";
import {Row} from "../layout/Row";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';

const ShopManager = () => {
    const [emgMsg, setEmgMsg] = useState('');
    const [baristaCount, setBaristaCount] = useState(1);

    const handleEmergency = (value: boolean) => {

    }

    const handleBaristaCount = (diff: number) => {
        const newCount = baristaCount + diff;

        if (newCount > 0) {
            setBaristaCount(newCount);
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