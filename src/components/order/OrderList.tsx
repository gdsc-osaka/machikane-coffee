import {Order} from "../../modules/redux/order/types";
import styled from "styled-components";
import {Typography} from "@mui/material";
import OrderListItem from "./OrderListItem";
import {Product} from "../../modules/redux/product/types";

type OrderListProps = {
    orders: Order[],
    onOrderUpdated: (id: string, newOrder: Order) => void;
    products: Product[],
}

const OrderList = (props: OrderListProps) => {
    const orders = props.orders;

    return (
        <Column>
            <Typography variant={"h4"} sx={{fontWeight: "bold"}}>
                注文一覧
            </Typography>
            {orders.map(order => <OrderListItem onOrderUpdated={props.onOrderUpdated} order={order} products={props.products}/>)}
        </Column>
    );
}

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
`


export default OrderList;