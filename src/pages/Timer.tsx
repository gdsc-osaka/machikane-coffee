import React, {useEffect, useState} from "react";
import {selectMaxCompleteAt, selectOrderStatus, streamOrders} from "../modules/redux/order/ordersSlice";
import {useSelector} from "react-redux";
import {RootState, useAppDispatch} from "../modules/redux/store";
import TimeDisplay from "../components/Timer/TimeDisplay";
import "../components/Timer/timer.css";
import {useParams} from "react-router-dom";
import {selectShopStatus, streamShop} from "src/modules/redux/shop/shopsSlice";
import {fetchProducts, selectProductStatus} from "src/modules/redux/product/productsSlice";
import {useCountDownInterval} from "../modules/hooks/useCountDownInterval";

const Timer = () => {
  const selector = useSelector((state: RootState) => state);
  const expectedEndTime: Date = selectMaxCompleteAt(selector);
  
  const dispatch = useAppDispatch();
  const params = useParams();
  const shopId = params.shopId ?? '';
  const shopStatus = useSelector(selectShopStatus);
  const orderStatus = useSelector(selectOrderStatus);
  const productStatus = useSelector(selectProductStatus);

  const [waitCount, setWaitCount] = useState(0);
  useCountDownInterval(waitCount, setWaitCount);

  useEffect(() => {
      const orderWaitTime: number = expectedEndTime.getTime() - new Date().getTime();
      setWaitCount(Math.floor(orderWaitTime / 1000));
  }, [expectedEndTime])

    const positiveWaitCount = waitCount > 0 ? waitCount : 0;
    const waitMin = Math.floor(positiveWaitCount / 60);
    const waitHou = Math.floor(waitMin / 60);

  // データを取得
  useEffect(() => {
      if (shopStatus === "idle" || shopStatus === "failed") {
          dispatch(streamShop(shopId));
      }
  }, [dispatch, shopStatus, shopId]);
  useEffect(() => {
      if (orderStatus === "idle" || orderStatus === "failed") {
          dispatch(streamOrders(shopId));
      }
  }, [dispatch, orderStatus, shopId]);
  useEffect(() => {
      if (productStatus === "idle" || productStatus === "failed") {
          dispatch(fetchProducts(shopId));
      }
  }, [dispatch, productStatus, shopId]);

  return (
    <div>
      <br />
      <br />
      <br />
      <br />
      <div className="text-6xl text-black-700 text-center font-semibold">
        ただいまの待ち時間
      </div>
      <br />
      <br />
      <TimeDisplay
        className="waiting-time"
        time={{
          hour: waitHou,
          min: waitMin % 60,
        }}
        delimiter=":"
        fontSize="7.8em"
      />
      <br />
      <div className="timer-unit">
        <span className="text-4xl text-black-700 text-center font-thin timer-hour-unit">
          時間
        </span>
        <span className="text-4xl text-black-700 text-center font-thin timer-min-unit">
          分
        </span>
      </div>
      <br />
      <br />
      <br />
      <br />
    </div>
  );
};

export default Timer;
