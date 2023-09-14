import {Column} from "../components/layout/Column";
import {ToggleButton, ToggleButtonGroup} from "@mui/material";
import {useEffect, useState} from "react";
import {RootState, useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {fetchShops, selectShopById, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import {useParams} from "react-router-dom";
import {Shop} from "../modules/redux/shop/types";

const AdminBaristaPage = () => {
    const [id, setId] = useState(1);

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

    return shop == undefined ? <div/> :
        <Column style={{width: "100%"}}>
            <ToggleButtonGroup sx={{padding: "0 1rem"}} fullWidth={true} value={id}>
                <ToggleButton value={1}>
                    1
                </ToggleButton>
                <ToggleButton value={2}>
                    2
                </ToggleButton>
            </ToggleButtonGroup>
        </Column>
}

export default AdminBaristaPage