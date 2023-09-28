import styled from "styled-components";
import {Box, Button, Grid, Stack, Typography} from "@mui/material";
import {Product} from "../../modules/redux/product/types";
import ProductCounter from "./ProductCounter";
import {ProductAmount} from "../../modules/redux/order/types";
import SubTotal from "./SubTotal";
import Container from "@mui/material/Container";

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
            <Grid item md={6} sx={{paddingRight: "10px"}}>
                <Stack spacing={2}>
                    {products.map(product => <ProductCounter product={product}
                                                             amount={productAmount[product.id] ?? 0}
                                                             onChangeAmount={(amount) => props.onChangeAmount(product.id, amount)}/>)}
                </Stack>
            </Grid>
            <Grid item md={6} sx={{paddingLeft: "10px"}}>
                <Stack spacing={2}>
                    <SubTotal productAmount={productAmount} products={products}/>
                    <Button variant={"contained"} disabled={isNoAmount} onClick={props.onOrderAddClicked}>
                        注文
                    </Button>
                </Stack>
            </Grid>
        </Grid>
    </Stack>
}

const ContentContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`

const CounterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
`

const SubTotalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  min-height: 16rem;
`

export default OrderForm;