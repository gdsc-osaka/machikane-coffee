import React, {useEffect} from "react";
import {useAppDispatch, useAppSelector} from "../modules/redux/store";
import TimeDisplay from "../components/Timer/TimeDisplay";
import "../components/Timer/timer.css";
import {useParams} from "react-router-dom";
import {selectProductStatus} from "src/modules/redux/product/productsSlice";
import {fetchProducts} from "../modules/redux/product/productsThunk";
import {selectAllOrders} from "../modules/redux/order/orderSelectors";
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {useDate} from "../modules/hooks/useDate";

const TimerPage = () => {
    const dispatch = useAppDispatch();
    const params = useParams();
    const shopId = params.shopId ?? '';

    const productStatus = useAppSelector(state => selectProductStatus(state, shopId));
    const allOrders = useAppSelector(state => selectAllOrders(state, shopId))
        .sort((a, b) => b.complete_at.seconds - a.complete_at.seconds);
    const completeAt = allOrders.length > 0 ? allOrders[0].complete_at.toMillis() + allOrders[0].delay_seconds * 1000 : 0;

    const now = useDate();
    const waitTime = completeAt > now ? (completeAt - now) / 1000 : 0;
    const waitMin = Math.floor(waitTime / 60);
    const waitHou = Math.floor(waitMin / 60);

    // データを取得
    useStreamEffect(shopId, "order", "shop");

    useEffect(() => {
        if (productStatus === "idle" || productStatus === "failed")
            dispatch(fetchProducts(shopId));
    }, [dispatch, productStatus, shopId]);

    return (
        <div>
            <br/>
            <br/>
            <br/>
            <br/>
            <div className="text-6xl text-black-700 text-center font-semibold">
                ただいまの待ち時間
            </div>
            <br/>
            <br/>
            <TimeDisplay
                className="waiting-time"
                time={{
                    hour: waitHou,
                    min: waitMin % 60,
                }}
                delimiter=":"
                fontSize="7.8em"
            />
            <br/>
            <div className="timer-unit">
        <span className="text-4xl text-black-700 text-center font-thin timer-hour-unit">
          時間
        </span>
                <span className="text-4xl text-black-700 text-center font-thin timer-min-unit">
          分
        </span>
            </div>
            <br/>
            <br/>
            <br/>
            <br/>
        </div>
    );
};

export default TimerPage;
