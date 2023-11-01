import {Stock} from "../../modules/redux/stock/stockTypes";
import {Product} from "../../modules/redux/product/productTypes";
import {Stack, Typography} from "@mui/material";
import styled from "styled-components";
import {ReactNode, useMemo} from "react";

type TableDataType = {
    [k in string]: {
        idle: number,
        working: number,
        completed: number,
        received: number,
    }
}

const StockTable = (props: {stocks: Stock[], products: Product[]}) => {
    const {stocks, products} = props;

    const tableData = useMemo(() => {
        const data: TableDataType = {};

        // 初期化
        for (const product of products) {
            const pid = product.id;

            data[pid] = {
                idle: 0,
                working: 0,
                completed: 0,
                received: 0
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

    return <Stack spacing={1}>
        <Stack direction={"row"} spacing={1} alignItems={"center"} sx={{paddingLeft: "48px"}}>
            <TableText variant={"label"}>
                待機中
            </TableText>
            <TableText variant={"label"}>
                作成中
            </TableText>
            <TableText variant={"label"}>
                完成済
            </TableText>
        </Stack>
        {products.map(p => {
            const pid = p.id;

            return <Stack direction={"row"} spacing={1} alignItems={"center"} key={`stock-table-${pid}`}>
                <RoundedImage alt={"product-icon"} src={p.thumbnail_url ?? ''}/>
                <TableText variant={"data"}>
                    {tableData[pid]?.idle ?? 0}
                </TableText>
                <TableText variant={"data"}>
                    {tableData[pid]?.working ?? 0}
                </TableText>
                <TableText variant={"data"}>
                    {tableData[pid]?.completed ?? 0}
                </TableText>
            </Stack>
        })}
    </Stack>
}

const TableText = (props: {
    children: ReactNode,
    variant: 'label' | 'data'
}) => {
    const {children, variant} = props;

    return <Typography fontSize={variant === 'label' ? '0.8rem' : '1.2rem'}
                       fontWeight={variant === 'label' ? '' : "bold"}
                       sx={variant === 'label' ? {color: (theme) => theme.typography.caption.color} : {}}
                       textAlign={"right"} width={"50px"}>
        {children}
    </Typography>
}

const RoundedImage = styled.img`
  border-radius: 10px;
  width: 40px;
  height: 40px;
`

export default StockTable;