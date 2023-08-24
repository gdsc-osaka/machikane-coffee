import {ProductAmount} from "../../modules/redux/order/types";
import styled from "styled-components";
import {Divider, Typography} from "@mui/material";
import {Product} from "../../modules/redux/product/types";
import React from "react";

type SubTotalProps = {
    productAmount: ProductAmount;
    products: Product[];
}

const SubTotal = (props: SubTotalProps) => {
    const products = props.products;
    const productAmount = props.productAmount;
    const ids = Object.keys(productAmount);
    // ProductAmount 型を使用しているが, 実際は id と price のマップ
    const productPrice = props.products.reduce((map: ProductAmount, obj) => {
        map[obj.id] = obj.price;
        return map;
    }, {});

    const isEmpty = ids.findIndex(id => productAmount[id] > 0) == -1

    let total = 0;
    for (const id of ids) {
        const price = productPrice[id];
        const amount = productAmount[id];
        total += price * amount;
    }

    return (
        <Container>
            {ids.map(id => {
                const amount = productAmount[id];

                if (amount <= 0) {
                    return <React.Fragment/>
                }

                const product = products.find((product) => product.id == id);

                return <Row>
                    <Typography>
                        {product?.display_name ?? ""}
                    </Typography>
                    <SubRow>
                        <Typography>
                            {amount}点
                        </Typography>
                        <RightAlign>
                            <Typography>
                                ¥{product != null ? product.price * amount : 0}
                            </Typography>
                        </RightAlign>
                    </SubRow>
                </Row>
            })}
            {!isEmpty ? <Divider variant={"fullWidth"} flexItem/> : <React.Fragment/>}
            <Row>
                <Typography>
                    合計
                </Typography>
                <Typography>
                    ¥{total}
                </Typography>
            </Row>
        </Container>
    );
}

const Container = styled.div`
  display: flex;
  width: 19rem;
  padding: 1rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
`

const SubRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0rem;
`

const RightAlign = styled.div`
  min-width: 4rem;
  display: flex;
  justify-content: end;
`


export default SubTotal;