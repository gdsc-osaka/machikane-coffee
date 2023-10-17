import styled from "styled-components";
import {Grid, Stack, Typography} from "@mui/material";
import {Product} from "../../modules/redux/product/productTypes";
import ProductCounter from "./ProductCounter";
import {ProductAmount} from "../../modules/redux/order/orderTypes";
import SubTotal from "./SubTotal";

type OrderFormProps = {
    products: Product[],
    productAmount: ProductAmount,
    onChangeAmount: (productId: string, amount: number) => void,
    onOrderAddClicked: () => void;
}

const OrderForm = (props: OrderFormProps) => {
    const productAmount = props.productAmount;
    const products = props.products;
    // ProductCounter から商品を追加していない
    const isNoAmount = Object.keys(productAmount).findIndex(id => productAmount[id] > 0) == -1

    return <Stack spacing={3}>
        <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
            注文登録
        </Typography>
        <Grid container spacing={0}>
            <Grid item md={7} sx={{paddingRight: "10px"}}>
                <Stack spacing={2}>
                    {products.map(product => <ProductCounter product={product}
                                                             amount={productAmount[product.id] ?? 0}
                                                             onChangeAmount={(amount) => props.onChangeAmount(product.id, amount)}/>)}
                </Stack>
            </Grid>
            <Grid item md={5} sx={{paddingLeft: "10px"}}>
                <SubTotal productAmount={productAmount}
                          products={products}
                          disabledButton={isNoAmount}
                          onClickButton={props.onOrderAddClicked}/>
            </Grid>
        </Grid>
    </Stack>
}

export default OrderForm;