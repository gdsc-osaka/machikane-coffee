import {Product} from "../../modules/redux/product/types";
import styled from "styled-components";
import {IconButton, Typography} from "@mui/material";
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

    return <RootContainer>
        <RoundedImage src={product.thumbnail_url}/>
        <ContentContainer>
            <Typography sx={{ fontWeight: 'bold', fontSize: "1rem"}}>
                {product.display_name}
            </Typography>
            <Typography sx={{ color: '#837468', fontSize: "0.9rem"}}>
                ¥{product.price}
            </Typography>
            <AmountSelectorContainer>
                <IconButton onClick={onDecrease}>
                    <Remove/>
                </IconButton>
                <Typography sx={{ fontSize: "2.5rem"}}>
                    {amount}
                </Typography>
                <IconButton onClick={onIncrease}>
                    <Add/>
                </IconButton>
            </AmountSelectorContainer>
        </ContentContainer>
    </RootContainer>
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
  width: 8rem;
  height: 8rem;
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