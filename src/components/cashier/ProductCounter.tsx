import {Product} from "../../modules/redux/product/productTypes";
import styled from "styled-components";
import {Card, IconButton, Stack, Typography} from "@mui/material";
import {Add, Remove} from '@mui/icons-material';
import {ProductAmount} from "../../modules/redux/order/orderTypes";

const ProductCounter = (props: {
    products: Product[],
    productAmount: ProductAmount,
    onChangeAmount: (productId: string, amount: number) => void,
}) => {
    const {products, productAmount, onChangeAmount} = props;

    return <Stack spacing={2}>
        {products.map(product => <ProductCounterItem product={product}
                                                     amount={productAmount[product.id] ?? 0}
                                                     onChangeAmount={(amount) => onChangeAmount(product.id, amount)}/>)}
    </Stack>
}

type ProductCounterItemProps = {
    product: Product,
    amount: number,
    onChangeAmount: (value: number) => void;
}

const ProductCounterItem = (props: ProductCounterItemProps) => {
    const product = props.product;
    const amount = props.amount;
    const onChangeAmount = props.onChangeAmount;
    const onDecrease = () => {
        if (amount > 0) onChangeAmount(amount - 1);
    }
    const onIncrease = () => onChangeAmount(amount + 1);

    return <Stack direction={"row"} alignItems={"center"} justifyContent={"flex-start"}
                  spacing={1}>
        <RoundedImage alt={'product-thumbnail'} src={product.thumbnail_url}/>
        <Stack spacing={0.5} padding={'1rem 0.5rem'}>
            <Typography variant={"body1"} sx={{fontWeight: 'bold', fontSize: "1rem"}}>
                {product.display_name}
            </Typography>
            <Typography variant={"body2"} sx={{color: '#837468'}}>
                ¥{product.price}
            </Typography>
            <Stack justifyContent={"space-between"} alignSelf={"stretch"}
                   direction={"row"}>
                <IconButton onClick={onDecrease} disabled={amount === 0}>
                    <Remove/>
                </IconButton>
                <Typography variant={"h4"} fontWeight={"bold"}>
                    {amount}
                </Typography>
                <IconButton onClick={onIncrease}>
                    <Add/>
                </IconButton>
            </Stack>
        </Stack>
    </Stack>
}

const RoundedImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 10px;
`

export default ProductCounter;