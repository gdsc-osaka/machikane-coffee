import {Stack, Typography, Link as MLink} from "@mui/material";
import {useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {fetchShops, selectAllShops, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import {useEffect} from "react";
import {Link} from "react-router-dom";

const RootPage = () => {
    const dispatch = useAppDispatch();
    const shopStatus = useSelector(selectShopStatus);
    const shops = useSelector(selectAllShops);

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
            {shops.map(shop => <MLink>
                <Link to={shop.id}>
                    {shop.display_name}
                </Link>
            </MLink> )}
        </Stack>
    </Stack>
}

export default RootPage