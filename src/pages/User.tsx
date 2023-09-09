import React from "react";
import { Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { NumberedTicket } from "../types/user/numberedTicket";
import { fetchOrders } from "../modules/redux/order/ordersSlice";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "../modules/redux/store";
import { selectAllOrders } from "../modules/redux/order/ordersSlice";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import {
  selectOrderStatus,
} from "../modules/redux/order/ordersSlice";
import { Timestamp } from "firebase/firestore";
import OrderRow from "../components/User/OrderRow";
import WaitForReceive from "../components/User/waitForReceive";

const User = () => {

    const params = useParams();
    const shopId = params.shopId ?? '';
    const dispatch = useAppDispatch();

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
    

    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(fetchOrders(shopId));
        }
    }, [dispatch, orderStatus]);

    return (
      <>
      <WaitForReceive orders={WaitForReceiveOrders} />
      <Table>
        {/* <TableHead>
          <TableRow>
            <TableCell>
              番号
            </TableCell>
            <TableCell>
              待ち時間
            </TableCell>
          </TableRow>
        </TableHead> */}
        <TableBody>
          {orderItems.map((order) => {
            return (
              <OrderRow order={order} />
            );
          })}
        </TableBody>
      </Table>
      </>
    );
  };
  
  export default User;
  