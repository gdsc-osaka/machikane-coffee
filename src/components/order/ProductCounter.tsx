import {Product} from "../../modules/redux/product/types";
import styled from "styled-components";
import {IconButton, Stack, Typography} from "@mui/material";
import {Remove, Add} from '@mui/icons-material';

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

    return <Stack direction={"row"} alignItems={"center"} justifyContent={"flex-start"} spacing={1} sx={{backgroundColor: "#FFF8F5", padding: "10px"}}>
        <RoundedImage src={product.thumbnail_url}/>
        <ContentContainer>
            <Typography variant={"body1"} sx={{ fontWeight: 'bold', fontSize: "1rem"}}>
                {product.display_name}
            </Typography>
            <Typography variant={"body2"} sx={{ color: '#837468'}}>
                ¥{product.price}
            </Typography>
            <AmountSelectorContainer>
                <IconButton onClick={onDecrease}>
                    <Remove/>
                </IconButton>
                <Typography variant={"h4"}>
                    {amount}
                </Typography>
                <IconButton onClick={onIncrease}>
                    <Add/>
                </IconButton>
            </AmountSelectorContainer>
        </ContentContainer>
    </Stack>
}

const RootContainer = styled.div`
  display: flex;
  padding: 1rem;
  align-items: center;
  gap: 1rem;
  align-self: stretch;
  border-radius: 10px;
  background-color: #FFF8F5;
`

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