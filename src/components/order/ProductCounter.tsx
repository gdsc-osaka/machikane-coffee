import {Product} from "../../modules/redux/product/productTypes";
import styled from "styled-components";
import {Card, IconButton, Stack, Typography} from "@mui/material";
import {Add, Remove} from '@mui/icons-material';

type ProductCounterType = {
    product: Product,
    amount: number,
    onChangeAmount: (value: number) => void;
}

const ProductCounter = (props: ProductCounterType) => {
    const product = props.product;
    const amount = props.amount;
    const onChangeAmount = props.onChangeAmount;
    const onDecrease = () => {
        if (amount > 0) onChangeAmount(amount - 1);
    }
    const onIncrease = () => onChangeAmount(amount + 1);

    return <Card sx={{boxShadow: 'none'}}>
        <Stack direction={"row"} alignItems={"center"} justifyContent={"flex-start"} spacing={1} sx={{padding: "10px"}}>
            <RoundedImage src={product.thumbnail_url}/>
            <ContentContainer>
                <Typography variant={"body1"} sx={{ fontWeight: 'bold', fontSize: "1rem"}}>
                    {product.display_name}
                </Typography>
                <Typography variant={"body2"} sx={{ color: '#837468'}}>
                    ¥{product.price}
                </Typography>
                <AmountSelectorContainer>
                    <IconButton onClick={onDecrease} disabled={amount === 0}>
                        <Remove/>
                    </IconButton>
                    <Typography variant={"h4"} fontWeight={"bold"}>
                        {amount}
                    </Typography>
                    <IconButton onClick={onIncrease}>
                        <Add/>
                    </IconButton>
                </AmountSelectorContainer>
            </ContentContainer>
        </Stack>
    </Card>
}

const RoundedImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 10px;
`

const ContentContainer = styled.div`
  display: flex;
  padding: 0.6rem 0;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  gap: 0.1rem;
  flex: 1 0 0;
  align-self: stretch;
`

const AmountSelectorContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1 0 0;
  align-self: stretch;
`

export default ProductCounter;