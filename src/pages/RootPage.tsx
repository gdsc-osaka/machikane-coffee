import {Link as MLink, Stack, Typography} from "@mui/material";
import {useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {selectPublicShops, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import {useEffect} from "react";
import {Link} from "react-router-dom";
import {fetchShops} from "../modules/redux/shop/shopsThunk";

const RootPage = () => {
    const dispatch = useAppDispatch();
    const shopStatus = useSelector(selectShopStatus);
    const shops = useSelector(selectPublicShops);

    useEffect(() => {
        if (shopStatus === "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    return <Stack spacing={2} sx={{padding: "1rem"}}>
        <Typography variant={"h4"} fontWeight={"bold"}>
            店舗一覧
        </Typography>
        <Stack spacing={1}>
            {shops.map(shop => <MLink key={shop.id}>
                <Link to={shop.id}>
                    {shop.display_name}
                </Link>
            </MLink> )}
        </Stack>
    </Stack>
}

export default RootPage