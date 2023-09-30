import { VFC } from "react";
import React from "react";
import { selectProductById } from "../../modules/redux/product/productsSlice";
import { RootState } from "../../modules/redux/store";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";


type Props = {
    productId: string
}

const ProductNameForOrderRow: VFC<Props> = (props) => {
    
    const product = useSelector((state: RootState) => selectProductById(state, props.productId));
    
    const [productShorterName, setProductShorterName] = useState<string>("");

    useEffect(() => {
        if(product?.shorter_name)setProductShorterName(product?.shorter_name);
    }, [product]);

    console.log(props.productId);
    console.log(product);

    return(
        <div>
            {product ? product.shorter_name + "×" + "2": ""}
        </div>
    );
}

export default ProductNameForOrderRow;