import React, {useEffect, useState} from "react";
import styled from "styled-components";
import {useSelector} from "react-redux";
import {fetchProducts, selectAllProduct, selectProductStatus} from "../modules/redux/product/productsSlice";
import {useAppDispatch} from "../modules/redux/store";
import {useParams} from "react-router-dom";
import {ProductAmount} from "../modules/redux/order/types";
import OrderForm from "../components/Order/OrderForm";
import {CircularProgress} from "@mui/material";
import {addOrder} from "../modules/redux/order/ordersSlice";

const AdminPage = () => {
    const dispatch = useAppDispatch();
    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);
    const params = useParams();
    const shopId = params.shopId ?? '';

    const [productAmount, setProductAmount] = useState<ProductAmount>({});
    const onChangeAmount = (productId: string, amount: number) => {
        setProductAmount({...productAmount, [productId]: amount});
    }

    useEffect(() => {
        if (productStatus == "idle" || productStatus == "failed") {
            dispatch(fetchProducts(shopId));
        }
    }, [dispatch, productStatus]);

    const onOrderAddClicked = async () => {
        await dispatch(addOrder({shopId: shopId, rawOrder: {is_student: false, product_amount: productAmount}}));
    }

    return(
        productStatus == "succeeded" ?
            <RootDiv>
                <OrderForm products={products} onChangeAmount={onChangeAmount} productAmount={productAmount} onOrderAddClicked={onOrderAddClicked}/>
            </RootDiv>
            : <CircularProgress />
    )
}

const RootDiv = styled.div`
  display: flex;
  width: auto;
  height: auto;
  padding: 1rem 2rem;
  justify-content: left;
  align-items: flex-start;
  gap: 1rem;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3vh;
`

export default AdminPage;