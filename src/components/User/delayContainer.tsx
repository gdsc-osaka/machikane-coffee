import {Button, Card, Stack, Typography} from "@mui/material";
import React from "react";
import {useCookies} from "react-cookie";
import {Shop} from "../../modules/redux/shop/types";
import {selectShopDelaySeconds} from "../../modules/redux/shop/shopsSlice";
import {RootState} from "../../modules/redux/store";
import {useSelector} from "react-redux";


type Props = {
    shop: Shop,
}

const DelayContainer = (props: Props) => {
    const delayContainerStyle = {
        display: 'flex',
        padding: '24px',
        flexDirection: 'column' as 'column',
        alignItems: 'flex-start',
        gap: '16px',
        borderRadius: '20px',
        background: 'var(--m-3-sys-light-error-container, #FFDAD6)',
    }
    const headLineStyle = {
        color: 'var(--m-3-sys-light-on-error-container, #410002)',
        fontFamily: 'Roboto',
        fontSize: '24px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: '32px',
    }
    const supportingTextStyle = {
        color: 'var(--m-3-sys-light-on-surface-variant, #51453A)',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: '20px',
        letterSpacing: '0.25px',
    }
    const buttonStyle = {
        display: 'flex',
        flexDirection: 'column' as 'column',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '10px',
        alignSelf: 'stretch',
    }
    const buttonFontStyle = {
        color: 'var(--m-3-sys-light-on-error-container, #410002)',
        textAlign: 'center' as 'center',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '20px', /* 142.857% */
        letterSpacing: '0.1px',
    }

    const {shop} = props;

    const [cookies, setCookie] = useCookies(["last_active_time"]);

    const handleNeverShow = () => {
        setCookie("last_active_time", shop?.last_active_time.seconds);
    }

    const delaySec = useSelector((state: RootState) => selectShopDelaySeconds(state, shop.id));
    const delayMin = Math.floor(delaySec / 60);

    // pause_orderingでも、shop.last_active_timeがCookieと一致すればダイアログを表示しない
    return shop.status === "pause_ordering" && shop.last_active_time.seconds !== cookies.last_active_time
        ? <Card sx={{backgroundColor: '#FFDAD6', boxShadow: "none"}}>
            <Stack padding={"1rem"} spacing={1}>
                <Typography variant={"h6"} color={'#410002'}>
                    {delayMin > 0 ? `提供が${delayMin}分遅延しています` : "提供が遅延しています"}
                </Typography>
                <Typography variant={"body1"} color={'#51453A'}>
                    {shop.emg_message}
                </Typography>
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