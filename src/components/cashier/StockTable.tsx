import {Stock} from "../../modules/redux/stock/stockTypes";
import {Product} from "../../modules/redux/product/productTypes";
import {Stack, Typography, useTheme} from "@mui/material";
import styled from "styled-components";
import {useMemo} from "react";

type TableDataType = {
    [k in string]: {
        idle: number,
        working: number,
        completed: number,
    }
}

const StockTable = (props: {stocks: Stock[], products: Product[]}) => {
    const {stocks, products} = props;

    const theme = useTheme();

    const tableData = useMemo(() => {
        const data: TableDataType = {};

        // 初期化
        for (const product of products) {
            const pid = product.id;

            data[pid] = {
                idle: 0,
                working: 0,
                completed: 0,
            }
        }

        // データ入れる
        for (const stock of stocks) {
            const prod = products.find(p => p.id === stock.product_id);

            if (prod) {
                const productId = prod.id;
                const stockStatus = stock.status;

                if (!data.hasOwnProperty(productId)) {
                    data[productId][stockStatus] = 1;
                } else {
                    data[productId][stockStatus]++;
                }

            }
        }

        return data;
        // productsはproduct.stockで頻繁に更新されるのでdepsに入れない
    }, [products, stocks])

    return <Stack spacing={1} >
        <Stack direction={"row"} spacing={1} alignItems={"center"} sx={{paddingLeft: "48px"}}>
            <Typography variant={"body1"} fontWeight={"bold"} width={"50px"}>
                待機中
            </Typography>
            <Typography variant={"body1"} fontWeight={"bold"} width={"50px"}>
                作成中
            </Typography>
        </Stack>
        {products.map(p => {
            const pid = p.id;

            return <Stack direction={"row"} spacing={1} alignItems={"center"}>
                <RoundedImage alt={"product-icon"} src={p.thumbnail_url ?? ''}/>
                <Typography variant={"body1"} fontWeight={"bold"} textAlign={"right"} width={"50px"}>
                    {tableData[pid]?.idle ?? 0}
                </Typography>
                <Typography variant={"body1"} fontWeight={"bold"} textAlign={"right"} width={"50px"}>
                    {tableData[pid]?.working ?? 0}
                </Typography>
            </Stack>
        })}
    </Stack>
}

const RoundedImage = styled.img`
  border-radius: 10px;
  width: 40px;
  height: 40px;
`

export default StockTable;