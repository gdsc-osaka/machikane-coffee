import {Order} from "../../modules/redux/order/types";
import styled from "styled-components";
import {Product} from "../../modules/redux/product/types";
import {Checkbox, IconButton} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import IndexIcon from "./IndexIcon";
import {getOrderLabel} from "../../modules/util/orderUtils";

type OrderListItemProps = {
    order: Order;
    onOrderUpdated: (id: string, newOrder: Order) => void;
    products: Product[];
}

const OrderListItem = (props: OrderListItemProps) => {
    const order = props.order;
    const products = props.products;
    let labelStr = getOrderLabel(order, products);

    return (
        <Container>
            <Row>
                <CenterWithGap>
                    <IndexIcon>{order.index}</IndexIcon>
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

export default OrderListItem;