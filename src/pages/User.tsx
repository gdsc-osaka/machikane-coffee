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

const User = () => {

    // const numberedTickets: NumberedTicket[] = [
    //   {
    //     id: "randomstring1",
    //     number: 1,
    //     status: "お受け取りありがとうございました。",
    //   },
    //   {
    //     id: "randomstring",
    //     number: 2,
    //     status: "できあがりました、お受け取り下さい。",
    //   },
    //   {
    //     id: "randomstring",
    //     number: 3,
    //     status: 3,
    //   },
    // ];

    const params = useParams();
    const shopId = params.shopId ?? '';

    

    const dispatch = useAppDispatch();

    const orders = useSelector(selectAllOrders);
    const orderStatus = useSelector(selectOrderStatus);

    
    

    useEffect(() => {
        if (orderStatus == "idle" || orderStatus == "failed") {
            dispatch(fetchOrders(shopId));
        }
    }, [dispatch, orderStatus]);

    return (
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
          {orders.map((order) => {
            return (
              <OrderRow order={order} />
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  export default User;
  