import React, {useEffect, useLayoutEffect, useState} from "react";
import styled from "styled-components";
import {useSelector} from "react-redux";
import {
    fetchProducts,
    selectAllProduct,
    selectProductStatus,
} from "../modules/redux/product/productsSlice";
import {useAppDispatch} from "../modules/redux/store";
import {Navigate, redirect, useParams} from "react-router-dom";
import {ProductAmount} from "../modules/redux/order/types";
import OrderForm from "../components/order/OrderForm";
import {CircularProgress} from "@mui/material";
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

import {getAuth, getIdTokenResult, onAuthStateChanged} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {isatty} from "tty";

const AdminPage = () => {
    const dispatch = useAppDispatch();
    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);
    const unreceivedOrders = useSelector(selectUnreceivedOrder);
    const orderStatus = useSelector(selectOrderStatus);
    const params = useParams();
    const shopId = params.shopId ?? "";
    const [IsAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);

    const [productAmount, setProductAmount] = useState<ProductAmount>({});
    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    };

    useEffect(() => {
        const auth = getAuth();
        auth.onAuthStateChanged((user) => {
            if (user) {
                user.getIdTokenResult(true).then((result) => {
                    if (result.claims.admin === true) {
                        // admin
                        console.log("admin");
                        setIsAdmin(true);
                    } else {
                        // user
                        console.log("user");
                        setIsAdmin(false);
                    }
                });
            }
        });
        console.log(IsAdmin);
    }, [IsAdmin]);

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

    return IsAdmin !== undefined ? (
        IsAdmin ? (
            productStatus === "succeeded" ? (
                <RowLayout>
                    <Column>
                        <OrderForm
                            products={products}
                            onChangeAmount={onChangeAmount}
                            productAmount={productAmount}
                            onOrderAddClicked={onOrderAddClicked}
                        />
                        <ShopManager/>
                    </Column>
                    <OrderList
                        orders={unreceivedOrders}
                        onOrderUpdated={(id, order) => {
                        }}
                        products={products}
                    />
                </RowLayout>
            ) : (
                <CircularProgress/>
            )
        ) : (
            <Navigate to={"/" + shopId + "/user"}/>
        )
    ) : (
        <CircularProgress/>
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
