import React from "react";
import { Table, TableBody } from "@mui/material";
import { streamOrders } from "../modules/redux/order/ordersSlice";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "../modules/redux/store";
import { selectAllOrders } from "../modules/redux/order/ordersSlice";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  selectOrderStatus,
} from "../modules/redux/order/ordersSlice";
import { Timestamp } from "firebase/firestore";
import OrderRow from "../components/User/OrderRow";
import WaitForReceive from "../components/User/waitForReceive";
import DelayContainer from "../components/User/delayContainer";
import { selectShopStatus, streamShop, selectShopById } from "../modules/redux/shop/shopsSlice";
import { RootState } from "../modules/redux/store";
import { Shop } from "src/modules/redux/shop/types";
import { selectShopDelaySeconds } from "src/modules/redux/shop/shopsSlice";

const User = () => {

  const params = useParams();
  const shopId = params.shopId ?? '';
  const dispatch = useAppDispatch();
  const shopStatus = useSelector(selectShopStatus);
  const shop = useSelector<RootState, Shop | undefined>((state) =>
      selectShopById(state, shopId)
  );
  const [status, setStatus] = useState<string>("active");

  useEffect(() => {
    if (shopStatus == "idle" || shopStatus == "failed") {
        dispatch(streamShop(shopId));
    }
  }, [dispatch, shopStatus]);

  useEffect(() => {
    if(shop)setStatus(shop.status);
  }, [shop]);

  const orders = useSelector(selectAllOrders);
  const orderStatus = useSelector(selectOrderStatus);
  const delayMinutes = Math.floor(useSelector((state: RootState) => selectShopDelaySeconds(state, shopId)) / 60);

  const WaitForReceiveOrders = orders.filter((order) => {
    const completeAt = order.complete_at.seconds as unknown as number;
    const currentTime = new Date().getTime() / 1000;
    const waitTime = Math.floor((completeAt - currentTime + order.delay_seconds) / 60);
    return waitTime < -2; //TODOここがn分経過の分岐点
  });

  const orderItems = orders.filter((order) => {
    const completeAt = order.complete_at.seconds as unknown as number;
    const currentTime = new Date().getTime() / 1000;
    const waitTime = Math.floor((completeAt - currentTime + order.delay_seconds) / 60);
    return waitTime >= -2; //TODOここがn分経過の分岐点
  });
  
  const userPageStyle = {
    padding: '10px 10px 0px 10px',
  }

  useEffect(() => {
      if (orderStatus == "idle" || orderStatus == "failed") {
          dispatch(streamOrders(shopId));
      }
  }, [dispatch, orderStatus]);
  return (
    <div style={userPageStyle}>
    {status == "pause_ordering" ?  <DelayContainer delayMinutes={delayMinutes} /> : <></>}
    <WaitForReceive orders={WaitForReceiveOrders} />
    <Table>
      <TableBody>
        {orderItems.map((order) => {
          return (
            <OrderRow order={order} />
          );
        })}
      </TableBody>
    </Table>
    </div>
  );
};

export default User;
