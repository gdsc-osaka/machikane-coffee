import { VFC } from "react";
import { Order } from "../../modules/redux/order/types";
import { TableRow, TableCell } from "@mui/material";

type Props = {
    order: Order
}

const OrderRow: VFC<Props> = (props) => {
    const order = props.order;
    const completeAt = order.complete_at.seconds as unknown as number;
    const currentTime = new Date().getTime() / 1000;
    const waitTime = (completeAt - currentTime + order.delay_seconds) / 60;
    let message;
    if(waitTime <= 0){
        message = 'できあがりました'
    }
    else{
        message = '約' + waitTime + '分';
    }
    return(
        <TableRow>
            <TableCell>
                {order.index}
            </TableCell>
            <TableCell>
                {message}
            </TableCell>
        </TableRow>
    );
}

export default OrderRow;
  