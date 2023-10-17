import {CircularProgress, IconButton, Stack, Switch, Typography,} from "@mui/material";
import {Expanded} from "../layout/Expanded";
import {useEffect, useState} from "react";
import {Row} from "../layout/Row";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
    selectShopById,
    selectShopStatus,


} from "../../modules/redux/shop/shopsSlice";
import {useParams} from "react-router";
import {useSelector} from "react-redux";
import {RootState, useAppDispatch} from "../../modules/redux/store";
import {BaristaMap, Shop, ShopStatus,} from "../../modules/redux/shop/shopTypes";
import MarkdownTextField from "../MarkdownTextField";
import {changeShopStatus, streamShop, updateShop} from "../../modules/redux/shop/shopsThunk";

const ShopManager = () => {
    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? "";
    const shopStatus = useSelector(selectShopStatus);
    const shop = useSelector<RootState, Shop | undefined>((state) =>
        selectShopById(state, shopId)
    );
    const [emgMsg, setEmgMsg] = useState("");
    const [baristaCount, setBaristaCount] = useState(1);
    const [baristas, setBaristas] = useState<BaristaMap>({1: "active"});
    const [status, setStatus] = useState<ShopStatus>("active");

    useEffect(() => {
        if (shopStatus === "idle" || shopStatus === "failed") {
            dispatch(streamShop(shopId));
        }
    }, [dispatch, shopStatus]);

    useEffect(() => {
        if (shop !== undefined) {
            setEmgMsg(shop.emg_message);
            setBaristaCount(Object.keys(shop.baristas).length);
            setBaristas(shop.baristas);
            setStatus(shop.status);
        }
    }, [shop]);

    const handleEmergency = async (value: boolean) => {
        if (value) {
            // pause
            if (shop !== undefined) {
                // emgMsg
                await dispatch(
                    updateShop({
                        shopId: shopId,
                        rawShop: {
                            ...shop,
                            emg_message: emgMsg,
                        },
                    })
                );

                // status
                await dispatch(
                    changeShopStatus({shopId: shopId, status: "pause_ordering"})
                );

                setStatus("pause_ordering");
            }
        } else {
            // active
            if (shop !== undefined) {
                // emgMsg
                // await dispatch(
                //     updateShop({
                //         shopId: shopId,
                //         rawShop: {
                //             ...shop,
                //             emg_message: "",
                //         },
                //     })
                // );

                // status
                await dispatch(
                    changeShopStatus({
                        shopId: shopId,
                        status: "active",
                    })
                );

                setStatus("active");
            }
        }
    };
    const handleBaristaCount = async (diff: number) => {
        const newCount = baristaCount + diff;
        const trueBaristas = Object.assign({}, baristas); // make the copy

        if (newCount > 0) {
            if (diff > 0) {
                // 更新後のbarista数
                trueBaristas[newCount] = "inactive";
            } else {
                // 更新前のbarista数
                delete trueBaristas[baristaCount];
            }

            if (shop !== undefined) {
                await dispatch(
                    updateShop({
                        shopId: shopId,
                        rawShop: {
                            ...shop,
                            baristas: trueBaristas,
                        },
                    })
                );
            }

            await dispatch(
                changeShopStatus({
                    shopId: shopId,
                    status: status,
                })
            );
        }
    };
    return shop !== undefined &&
    (shop.status === "active" || shop.status === "pause_ordering") ? (
        <Stack spacing={3}>
            <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
                管理
            </Typography>
            <Stack spacing={2}>
                <Expanded>
                    <Typography variant={"h5"} sx={{fontWeight: "bold"}}>
                        提供中止
                    </Typography>
                    <Switch
                        disabled={emgMsg.length === 0}
                        defaultChecked={shop.status === "pause_ordering"}
                        onChange={(e) => handleEmergency(e.target.checked)}
                    />
                </Expanded>
                <MarkdownTextField
                    id="emg-message"
                    label="メッセージ"
                    variant="outlined"
                    helperText={"入力すると提供中止ボタンが押せます(Markdownが使用可能です)"}
                    value={emgMsg}
                    onChange={(e) => setEmgMsg(e.target.value)}
                    sx={{width: "100%"}}
                />
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
            </Stack>
        </Stack>
    ) : (
        <CircularProgress/>
    );
};
export default ShopManager;
