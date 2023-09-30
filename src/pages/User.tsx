import React from "react";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { NumberedTicket } from "../types/user/numberedTicket";
import { fetchOrders, streamOrders } from "../modules/redux/order/ordersSlice";
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
import { selectShopStatus, fetchShops } from "../modules/redux/shop/shopsSlice";

const User = () => {

    const params = useParams();
    const shopId = params.shopId ?? '';
    const dispatch = useAppDispatch();
    const shopStatus = useSelector(selectShopStatus);

    useEffect(() => {
      if (shopStatus == "idle") {
          dispatch(fetchShops());
      }
  }, [dispatch, shopStatus]);

    const orders = useSelector(selectAllOrders);
    const orderStatus = useSelector(selectOrderStatus);

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

    console.log(shopStatus);
    return (
      <div style={userPageStyle}>
      <DelayContainer />
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
  