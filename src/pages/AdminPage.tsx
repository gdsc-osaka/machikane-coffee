import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  fetchProducts,
  selectAllProduct,
  selectProductStatus,
} from "../modules/redux/product/productsSlice";
import { useAppDispatch } from "../modules/redux/store";
import { useParams } from "react-router-dom";
import { ProductAmount } from "../modules/redux/order/types";
import OrderForm from "../components/order/OrderForm";
import { CircularProgress } from "@mui/material";
import {
  addOrder,
  fetchOrders,
  selectOrderStatus,
  selectReceivedOrder,
  selectUnreceivedOrder,
} from "../modules/redux/order/ordersSlice";
import OrderList from "../components/order/OrderList";
import ShopManager from "../components/order/ShopManager";
import firebase from "src/modules/firebase/firebase";
import "firebase/auth";

import { getAuth, getIdTokenResult, onAuthStateChanged } from "firebase/auth";

const AdminPage = () => {
  const dispatch = useAppDispatch();
  const products = useSelector(selectAllProduct);
  const productStatus = useSelector(selectProductStatus);
  const unreceivedOrders = useSelector(selectUnreceivedOrder);
  const orderStatus = useSelector(selectOrderStatus);
  const params = useParams();
  const shopId = params.shopId ?? "";

  const [productAmount, setProductAmount] = useState<ProductAmount>({});
  const onChangeAmount = (productId: string, amount: number) => {
    setProductAmount({ ...productAmount, [productId]: amount });
  };

  // TODO onAuthStateChanged
  // https://firebase.google.com/docs/auth/web/manage-users?hl=ja#web-modular-api
  useEffect(() => {
    console.log("admin");
    const auth = getAuth();
    // const user = auth.currentUser;
    auth.onAuthStateChanged((user) => {
      if (user) {
        user.getIdTokenResult(true).then((result) => {
          if (result.claims.admin === true) {
            // admin
            console.log("result.claims: ");
            console.log(result.claims);
          }
        });
      }
    });

    // firebase.auth().currentUser.getIdTokenResult();
  }, []);

  useEffect(() => {
    if (productStatus == "idle" || productStatus == "failed") {
      dispatch(fetchProducts(shopId));
    }
  }, [dispatch, productStatus]);

  useEffect(() => {
    if (orderStatus == "idle" || orderStatus == "failed") {
      dispatch(fetchOrders(shopId));
    }
  }, [dispatch, orderStatus]);

  const onOrderAddClicked = async () => {
    const trueProductAmount = Object.assign({}, productAmount);
    // ゼロの要素は排除する
    for (const id in trueProductAmount) {
      if (trueProductAmount[id] == 0) {
        delete trueProductAmount[id];
      }
    }

    await dispatch(
      addOrder({
        shopId: shopId,
        rawOrder: {
          is_student: false,
          product_amount: trueProductAmount,
          status: "idle",
        },
      })
    );
  };

  return productStatus == "succeeded" ? (
    <RowLayout>
      <Column>
        <OrderForm
          products={products}
          onChangeAmount={onChangeAmount}
          productAmount={productAmount}
          onOrderAddClicked={onOrderAddClicked}
        />
        <ShopManager />
      </Column>
      <OrderList
        orders={unreceivedOrders}
        onOrderUpdated={(id, order) => {}}
        products={products}
      />
    </RowLayout>
  ) : (
    <CircularProgress />
  );
};

const RowLayout = styled.div`
  display: flex;
  width: auto;
  height: auto;
  padding: 1rem 2rem;
  justify-content: left;
  align-items: flex-start;
  gap: 1rem;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3vh;
`;

export default AdminPage;
