import {Product} from "../../modules/redux/product/productTypes";
import {Stack} from "@mui/material";
import styled from "styled-components";

const StockList = (props: {
    products: Product[],
}) => {

    return <Stack direction={"row"} spacing={2}>
        {props.products.map(product =>
            <Stack alignItems={"flex-end"} key={`stock-list-${product.id}`}>
                <ProductIcon src={product.thumbnail_url} alt={`Thumbnail of ${product.display_name}`}/>
                <AmountLabel>
                    {product.stock}
                </AmountLabel>
            </Stack>
        )}
    </Stack>
}

const ProductIcon = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 10px;
`

const AmountLabel = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: -1.2rem;
  z-index: 1;
  color: white;
  -webkit-text-fill-color: black; /* （順序に関係なく）色を上書きする */
  -webkit-text-stroke: 1px white;
`

export default StockList;