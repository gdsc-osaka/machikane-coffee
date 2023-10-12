import React, { useEffect } from "react";
import { selectMaxCompleteAt, selectOrderStatus, streamOrders } from "../modules/redux/order/ordersSlice";
import { useSelector } from "react-redux";
import { RootState, useAppDispatch } from "../modules/redux/store";
import TimeDisplay from "../components/Timer/TimeDisplay";
import "../components/Timer/timer.css";
import { useParams } from "react-router-dom";
import { selectShopStatus, streamShop } from "src/modules/redux/shop/shopsSlice";
import { fetchProducts, selectProductStatus } from "src/modules/redux/product/productsSlice";

const Timer = () => {
  const selector = useSelector((state: RootState) => state);
  const expectedEndTime: Date = selectMaxCompleteAt(selector);
  
  const dispatch = useAppDispatch();
  const params = useParams();
  const shopId = params.shopId ?? '';
  const shopStatus = useSelector(selectShopStatus);
  const orderStatus = useSelector(selectOrderStatus);
  const productStatus = useSelector(selectProductStatus);

  const now: Date = new Date();
  const orderWaitTime: number = expectedEndTime.getTime() - now.getTime();
  let orderWaitHour: number, orderWaitMinute: number;
  if (orderWaitTime > 0) {
    orderWaitHour = Math.floor(orderWaitTime / (1000 * 60 * 60));
    orderWaitMinute = Math.floor(orderWaitTime / (1000 * 60)) % 60;
  } else {
    orderWaitHour = 0;
    orderWaitMinute = 0;
  }

  // データを取得
  useEffect(() => {
      if (shopStatus === "idle" || shopStatus === "failed") {
          dispatch(streamShop(shopId));
      }
  }, [dispatch, shopStatus]);
  useEffect(() => {
      if (orderStatus === "idle" || orderStatus === "failed") {
          dispatch(streamOrders(shopId));
      }
  }, [dispatch, orderStatus]);
  useEffect(() => {
      if (productStatus === "idle" || productStatus === "failed") {
          dispatch(fetchProducts(shopId));
      }
  }, [dispatch, productStatus]);

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
          hour: orderWaitHour,
          min: orderWaitMinute,
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
