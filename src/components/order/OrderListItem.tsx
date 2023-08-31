import {Order} from "../../modules/redux/order/types";
import styled from "styled-components";
import {Product} from "../../modules/redux/product/types";
import {Checkbox, IconButton} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

type OrderListItemProps = {
    order: Order;
    onOrderUpdated: (id: string, newOrder: Order) => void;
    products: Product[];
}

const OrderListItem = (props: OrderListItemProps) => {
    const order = props.order;
    const products = props.products;
    let labelStr = "";

    for (const productId in order.product_amount) {
        if (labelStr.length != 0) {
            labelStr += " / "
        }

        const product = products.find(e => e.id == productId);
        const amount = order.product_amount[productId];

        if (product != undefined) {
            labelStr += `${product.shorter_name}×${amount}`;
        }
    }

    return (
        <Container>
            <Row>
                <CenterWithGap>
                    <Index>{order.index}</Index>
                    {labelStr}
                </CenterWithGap>
                <Center>
                    <Checkbox/>
                    <Checkbox/>
                    <IconButton>
                        <DeleteIcon/>
                    </IconButton>
                </Center>
            </Row>
            {/*{Object.keys(order.order_statuses).map(id => {*/}
            {/*    const status = order.order_statuses[id];*/}

            {/*    return (*/}
            {/*        <Row>*/}

            {/*        </Row>*/}
            {/*    )*/}
            {/*})}*/}
        </Container>
    )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  align-self: stretch;
  border-radius: 10px;
  background-color: #FFF8F5;
`

const Row = styled.div`
  display: flex;
  padding: 0.5rem 1rem;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  gap: 0.5rem
`

const Center = styled.div`
  display: flex;
  align-items: center;
`

const CenterWithGap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Index = styled.div`
  display: flex;
  width: 2rem;
  height: 2rem;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 100px;
  background-color: #F2DFD1;
`

export default OrderListItem;