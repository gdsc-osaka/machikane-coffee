import {ProductAmount} from "../../modules/redux/order/orderTypes";
import styled from "styled-components";
import {Button, Divider, Typography, useTheme} from "@mui/material";
import {Product} from "../../modules/redux/product/productTypes";
import React from "react";
import {MotionList, MotionListItem} from "../motion/motionList";

type SubTotalProps = {
    productAmount: ProductAmount;
    products: Product[];
    disabledButton: boolean;
    onClickButton: () => void;
}

const SubTotal = (props: SubTotalProps) => {
    const theme = useTheme();
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
        <MotionList layoutId={"sub-total"}>
                {ids.map(id => {
                    const amount = productAmount[id];
                    const product = products.find((product) => product.id == id);

                    return amount > 0 && <MotionListItem key={id} spacing={1}>
                        <Row>
                            <Typography variant={"body2"}>
                                {product?.shorter_name ?? ""}
                            </Typography>
                            <SubRow>
                                <Typography variant={"body2"}>
                                    {amount}点
                                </Typography>
                                <RightAlign>
                                    <Typography variant={"body2"}>
                                        ¥{product != null ? product.price * amount : 0}
                                    </Typography>
                                </RightAlign>
                            </SubRow>
                        </Row>
                    </MotionListItem>
                })}
                {!isEmpty && <MotionListItem key={"subtotal-divider"} spacing={1}>
                    <Divider variant={"fullWidth"} flexItem/>
                </MotionListItem>}
                <MotionListItem key={"total"}>
                    <Row>
                        <Typography variant={"body1"}>
                            合計
                        </Typography>
                        <Typography variant={"body1"}>
                            ¥{total}
                        </Typography>
                    </Row>
                </MotionListItem>
                <MotionListItem key={"subtotal-button"}>
                    <Button variant={"contained"}
                            disabled={props.disabledButton}
                            onClick={props.onClickButton}
                            style={{marginTop: theme.spacing(2), width: "100%"}}>
                        注文
                    </Button>
                </MotionListItem>

        </MotionList>
    );
}

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