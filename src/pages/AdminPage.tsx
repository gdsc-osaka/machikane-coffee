import {ReactNode, useEffect, useRef, useState} from "react";
import {Button, ButtonBase, Card, Divider, InputAdornment, Stack, Typography} from "@mui/material";
import {useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {fetchShops, selectAllShops, selectShopStatus, updateShop} from "../modules/redux/shop/shopsSlice";
import styled from "styled-components";
import TextField from "@mui/material/TextField";
import {Shop} from "../modules/redux/shop/types";
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import {Product} from "../modules/redux/product/types";
import {
    fetchProducts,
    selectAllProduct,
    selectProductStatus,
    updateProduct
} from "../modules/redux/product/productsSlice";
import React from "react";

const DataDivider = styled(Divider)`
  border-color: #D5C3B5;
`

type ProductFormType = {
    display_name: string;
    span: number;
    price: number;
    shorter_name: string;
}

type ShopFormType = {
    display_name: string;
}

function getFileExt(file: File) {
    const name = file.name;
    return name.split('.').pop() ?? '';
}

const AdminPage = () => {
    const [selectedShopId, setSelectedShopId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [isThumbnailError, setIsThumbnailError] = useState(false);
    const [shopForm, setShopForm] = useState<ShopFormType>({
        display_name: ""
    });
    const [productForm, setProductForm] = useState<ProductFormType>({
        display_name: "",
        price: 0,
        shorter_name: "",
        span: 0
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);

    const dispatch = useAppDispatch();
    const shopStatus = useSelector(selectShopStatus);
    const shops = useSelector(selectAllShops);
    const selectedShop = shops.find(shop => shop.id === selectedShopId);
    const products = useSelector(selectAllProduct);
    const productStatus = useSelector(selectProductStatus);
    const selectedProduct = products.find(p => p.id === selectedProductId);

    const isProductChanged = (newProductForm: ProductFormType) => {
        if (selectedProduct === undefined) return false;

        const defaultProductForm: ProductFormType = {...selectedProduct};

        return defaultProductForm.display_name !== newProductForm.display_name ||
            defaultProductForm.shorter_name !== newProductForm.shorter_name ||
            defaultProductForm.price !== newProductForm.price ||
            defaultProductForm.span !== newProductForm.span ||
            thumbnailFile !== undefined;
    }

    const isShopChanged = (newShopForm: ShopFormType) => {
        if (selectedShop === undefined) return false;

        const defaultShopForm: ShopFormType = {...selectedShop};

        return defaultShopForm.display_name !== newShopForm.display_name;
    }

    useEffect(() => {
        if (shopStatus === "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    useEffect(() => {
        if (productStatus === "idle" && selectedShop !== undefined) {
            dispatch(fetchProducts(selectedShop.id));
        }
    }, [selectedShop, dispatch, productStatus]);

    useEffect(() => {
        if (shops.length !== 0) {
            const shop = shops[0];
            setSelectedShopId(shop.id);
        }
    }, [shops]);

    useEffect(() => {
        if (products.length !== 0) {
            const product = products[0];
            setSelectedProductId(product.id);
        }
    }, [products]);

    useEffect(() => {
        if (selectedShop !== undefined) {
            setShopForm({...selectedShop});
        }
    }, [selectedShop])

    useEffect(() => {
        if (selectedProduct !== undefined) {
            setProductForm({...selectedProduct});
        }
    }, [selectedProduct])

    const handleAddShop = () => {

    }

    const handleAddProduct = (shopId: string) => {

    }

    const handleClickShop = (shopId: string) => {
        setSelectedShopId(shopId);
    }


    const handleClickProduct = (productId: string) => {
        setThumbnailFile(undefined);
        setSelectedProductId(productId);
    }

    const handleSetThumbnail = (file: File) => {
        if (['png', 'jpg'].includes(getFileExt(file))) {
            // 拡張子が合法なら
            // TODO: 正方形制限
            setThumbnailFile(file);
            setIsThumbnailError(false);
        } else {
            setIsThumbnailError(true);
        }
    }

    const handleProductForm = (newProdForm: ProductFormType) => {
        setProductForm(newProdForm);
    }

    const handleUpdateShop = () => {
        if (selectedShop !== undefined) {
            dispatch(updateShop({shopId: selectedShop.id, rawShop: {...selectedShop, ...shopForm}}))
                .then(() => {
                    dispatch(fetchShops());
                });
        }
    }

    const handleUpdateProduct = () => {
        if (selectedProduct !== undefined && selectedShop !== undefined) {
            dispatch(updateProduct({
                shopId: selectedShop.id,
                rawProduct: {...selectedProduct, ...productForm},
                thumbnailFile: thumbnailFile
            })).then(() => {
                dispatch(fetchProducts(selectedShop.id));
            });
            setThumbnailFile(undefined);
        }

    }

    return <Card sx={{border: "1px solid #837468", boxShadow: "none", margin: "1rem"}}>
        <Stack direction={"row"} minHeight={"600px"}>
            <Stack width={"250px"}>
                <ViewLabel icon={<StorefrontOutlinedIcon/>} label={"店舗"}/>
                <AddTextButton addLabel={"店舗を追加する"} onClickAdd={handleAddShop}/>
                {shops.map(shop => <SelectionItem label={shop.id}
                                                  selected={shop.id === selectedShopId}
                                                  onClick={() => handleClickShop(shop.id)}/>)}
            </Stack>
            <DataDivider orientation={"vertical"} flexItem/>
            <Stack width={"100%"}>
                <ViewLabel icon={<EditOutlinedIcon/>} label={selectedShop?.id ?? ''}/>
                {selectedShop !== undefined &&
                    <React.Fragment>
                        <Stack padding={"1.5rem"} spacing={2} alignItems={"flex-start"}>
                            <TextField label={"名前"} value={shopForm.display_name}
                                       onChange={e => setShopForm({...shopForm, display_name: e.target.value})}/>
                            <Button variant={"contained"} disabled={!isShopChanged(shopForm)}
                                    onClick={handleUpdateShop}>
                                保存
                            </Button>
                        </Stack>
                        <ProductDataView shop={selectedShop}
                                         products={products}
                                         onAddProduct={handleAddProduct}
                                         selectedProductId={selectedProductId}
                                         onClickProduct={handleClickProduct}
                                         isThumbnailError={isThumbnailError}
                                         productForm={productForm}
                                         setProductForm={handleProductForm}
                                         selectedProduct={selectedProduct}
                                         isProductFormChanged={isProductChanged(productForm)}
                                         thumbnailFile={thumbnailFile}
                                         setThumbnail={handleSetThumbnail}
                                         onUpdateProduct={handleUpdateProduct}/>
                    </React.Fragment>
                }
            </Stack>
        </Stack>
    </Card>
}

const ProductDataView = (props: {
    shop: Shop,
    products: Product[],
    onAddProduct: (shopId: string) => void,
    selectedProductId: string,
    onClickProduct: (productId: string) => void,
    isThumbnailError: boolean,
    productForm: ProductFormType,
    setProductForm: (newProductForm: ProductFormType) => void;
    selectedProduct: Product | undefined,
    isProductFormChanged: boolean,
    thumbnailFile: File | undefined,
    setThumbnail: (file: File) => void,
    onUpdateProduct: () => void,
}) => {
    const {
        shop,
        products,
        onAddProduct,
        selectedProductId,
        onClickProduct,
        isThumbnailError,
        productForm,
        setProductForm,
        selectedProduct,
        isProductFormChanged,
        thumbnailFile,
        setThumbnail,
        onUpdateProduct
    } = props;

    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (thumbnailFile === undefined && selectedProduct !== undefined) {
            setThumbnailUrl(selectedProduct.thumbnail_url);
        } else if (thumbnailFile !== undefined) {
            setThumbnailUrl(window.URL.createObjectURL(thumbnailFile))
        }

    }, [thumbnailFile, selectedProduct]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setThumbnail(event.target.files[0]);
        }
    }

    return <Stack direction={"row"} height={"100%"}>
        <Stack width={"400px"}>
            <ViewLabel icon={<CoffeeOutlinedIcon/>} label={"商品"}/>
            <AddTextButton addLabel={"商品を追加する"} onClickAdd={() => onAddProduct(shop.id)}/>
            {products.map(prod => <SelectionItem label={prod.id}
                                                 selected={prod.id === selectedProductId}
                                                 onClick={() => onClickProduct(prod.id)}/>)}
        </Stack>
        <DataDivider orientation={"vertical"} flexItem/>
        <Stack width={"100%"}>
            <ViewLabel icon={<EditOutlinedIcon/>} label={selectedProduct?.id ?? ''}/>
            {selectedProduct !== undefined &&
                <Stack padding={"1rem 1.5rem"} spacing={3} alignItems={"flex-start"}>
                    <Stack direction={"row"} spacing={3}>
                        <Stack spacing={3} minWidth={500}>
                            <Typography variant={"h6"}>
                                商品詳細
                            </Typography>
                            <Stack direction={"row"} spacing={2}>
                                <Stack spacing={2}>
                                    <TextField label={"名前"} value={productForm.display_name}
                                               onChange={e => setProductForm({
                                                   ...productForm,
                                                   display_name: e.target.value
                                               })}/>
                                    <TextField label={"略称"} value={productForm.shorter_name}
                                               onChange={e => setProductForm({
                                                   ...productForm,
                                                   shorter_name: e.target.value
                                               })}/>
                                </Stack>
                                <Stack spacing={2}>
                                    <TextField label={"値段"} value={productForm.price} type={"number"}
                                               InputProps={{
                                                   startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                                               }}
                                               onChange={e => setProductForm({
                                                   ...productForm,
                                                   price: Number(e.target.value)
                                               })}/>
                                    <TextField label={"販売時間"} value={productForm.span} type={"number"}
                                               InputProps={{
                                                   endAdornment: <InputAdornment position="end">秒</InputAdornment>,
                                               }}
                                               onChange={e => setProductForm({
                                                   ...productForm,
                                                   span: Number(e.target.value)
                                               })}/>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack spacing={3}>
                            <Typography variant={"h6"}>
                                サムネイルを編集
                            </Typography>
                            <Stack direction={"row"} spacing={1}>
                                <img style={{width: 120, height: 120, borderRadius: 10}}
                                     src={thumbnailUrl}
                                     alt={`thumbnail of ${selectedProduct.display_name}`}/>
                                <Stack spacing={1} width={"100%"} alignItems={"flex-start"}>
                                    <Button variant={"outlined"} onClick={_ => fileInputRef.current?.click()}>
                                        ファイルを選択
                                    </Button>
                                    <input
                                        hidden
                                        name="thumbnail"
                                        type="file"
                                        accept=".png,.jpg"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                    />
                                    {isThumbnailError &&
                                        <Typography variant={"caption"} color={'#BA1A1A'}>
                                            サムネイルは正方形のPNGまたはJPG画像を選択してください
                                        </Typography>}
                                </Stack>
                            </Stack>
                        </Stack>
                    </Stack>
                    <Button variant={"contained"} disabled={!isProductFormChanged} onClick={onUpdateProduct}>
                        保存
                    </Button>
                </Stack>
            }
        </Stack>
    </Stack>
}

const ViewLabel = (props: { icon: ReactNode, label: string }) => {
    return <Stack direction={"row"} spacing={1} padding={"0.75rem"} alignItems={"center"} justifyContent={"flex-start"}
                  sx={{backgroundColor: '#F2DFD1'}}>
        {props.icon}
        <Typography variant={"body1"}>
            {props.label}
        </Typography>
    </Stack>
}

type VoidFunction = () => void;

const AddTextButton = (props: { addLabel: string, onClickAdd: VoidFunction }) => {
    return <Button variant={"text"} startIcon={<AddRoundedIcon/>}
                   sx={{borderRadius: 0, justifyContent: "flex-start", height: "2.5rem", paddingLeft: "1.2rem"}}>
        {props.addLabel}
    </Button>
}

const SelectionItem = (props: { label: string, selected: boolean, onClick: VoidFunction }) => {
    return <ButtonBase onClick={props.onClick}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} paddingLeft={"2.8rem"}
               paddingRight={"1.2rem"}
               sx={{backgroundColor: props.selected ? '#F8EEE7' : 'none', width: '100%', height: "2.5rem"}}>
            <Typography variant={"button"}>
                {props.label}
            </Typography>
            {props.selected && <ArrowForwardIosRoundedIcon sx={{fontSize: 16}}/>}
        </Stack>
    </ButtonBase>
}

export default AdminPage;