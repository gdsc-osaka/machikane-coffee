import {Button, Card, Stack, Typography} from "@mui/material";
import React from "react";
import {useCookies} from "react-cookie";
import {Shop} from "../../modules/redux/shop/types";
import MyMarkdown from "../MyMarkdown";


type Props = {
    shop: Shop,
    delaySec: number
}

const DelayContainer = (props: Props) => {
    const {shop, delaySec} = props;

    const [cookies, setCookie] = useCookies(["last_active_time"]);

    const handleNeverShow = () => {
        setCookie("last_active_time", shop?.last_active_time.seconds);
    }

    const delayMin = Math.floor(delaySec / 60);

    // pause_orderingでも、shop.last_active_timeがCookieと一致すればダイアログを表示しない
    return shop.status === "pause_ordering" && shop.last_active_time.seconds !== cookies.last_active_time
        ? <Card sx={{backgroundColor: '#FFDAD6', boxShadow: "none"}}>
            <Stack padding={"1rem"} spacing={1}>
                <Typography variant={"h6"} color={'#410002'}>
                    {delayMin > 0 ? `提供が${delayMin}分遅延しています` : "提供が遅延しています"}
                </Typography>
                <MyMarkdown>
                    {shop.emg_message}
                </MyMarkdown>
                {/* <button style={buttonStyle} onClick={props.buttonClicked}>今後表示しない</button> */}
                <Stack alignItems={"flex-end"}>
                    <Button
                        onClick={handleNeverShow}
                        variant="outlined"
                    >
                        <Typography variant={"button"} color={'#410002'}>
                            今後表示しない
                        </Typography>
                    </Button>
                </Stack>
            </Stack>
        </Card>
        : <></>
}

export default DelayContainer;