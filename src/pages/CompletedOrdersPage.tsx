import {useParams} from "react-router-dom";
import {useStreamEffect} from "../modules/hooks/useStreamEffect";
import {useAppSelector} from "../modules/redux/store";
import {selectCompletedOrders} from "../modules/redux/order/orderSelectors";
import SimpleGrid from "../components/SimpleGrid";
import StickyNote from "../components/StickyNote";
import {Stack, Typography} from "@mui/material";
import Heading from "../components/Heading";
import useWindowSize from "../modules/hooks/useWindowSize";

const CompletedOrdersPage = () => {
    const params = useParams();
    const shopId = params.shopId ?? '';
    useStreamEffect(shopId, "order", "product");

    // Select data
    const completedOrders = useAppSelector(state => selectCompletedOrders(state, shopId));

    const [width, _] = useWindowSize();
    const column = Math.floor(width / 200);

    return <Stack spacing={2} padding={"20px"}>
        <Heading>
            完成済みの注文
        </Heading>
        <SimpleGrid column={column}>
            {completedOrders.map(order =>
                <StickyNote sx={{alignItems: "center"}}>
                    <Typography fontSize={"6rem"} fontWeight={"bold"}>
                        {order.index}
                    </Typography>
                </StickyNote>
            )}
        </SimpleGrid>
    </Stack>
}

export default CompletedOrdersPage;