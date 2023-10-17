import React, {useEffect, useState} from "react";
import {Button, Card, InputAdornment, Link as LinkText, Stack, Typography} from "@mui/material";
import {useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {selectAllShops, selectShopStatus} from "../modules/redux/shop/shopsSlice";
import TextField from "@mui/material/TextField";
import {Shop} from "../modules/redux/shop/shopTypes";
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import {Product} from "../modules/redux/product/productTypes";
import {
    selectAllProduct,
    selectProductStatus
} from "../modules/redux/product/productsSlice";
import FileInputButton from "../components/FileInputButton";
import {Link} from "react-router-dom";
import MarkdownTextField from "../components/MarkdownTextField";
import DataView from "../components/admin/DataView";
import AddProductDialog, {ProductFormType} from "../components/admin/AddProductDialog";
import AddShopDialog, {AddShopFormType} from "../components/admin/AddShopDialog";
import {addProduct, fetchProducts, updateProduct} from "../modules/redux/product/productsThunk";
import {addShop, fetchShops, updateShop} from "../modules/redux/shop/shopsThunk";

type ShopFormType = {
    display_name: string;
    message: string;
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
        display_name: "",
        message: "",
    });
    const [productForm, setProductForm] = useState<ProductFormType>({
        display_name: "",
        price: 0,
        shorter_name: "",
        span: 0
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | undefined>(undefined);
    const [openAddShopDialog, setOpenAddShopDialog] = useState(false);
    const [openAddProductDialog, setOpenAddProductDialog] = useState(false);

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

        return defaultShopForm.display_name !== newShopForm.display_name ||
            defaultShopForm.message !== newShopForm.message;
    }

    useEffect(() => {
        if (shopStatus === "idle") {
            dispatch(fetchShops());
        }
    }, [dispatch, shopStatus]);

    useEffect(() => {
        // status == idle じゃなくても実行する
        if (productStatus === "idle" && selectedShop?.id !== undefined) {
            dispatch(fetchProducts(selectedShop.id));
        }
    }, [selectedShop?.id, dispatch, productStatus]);

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
        setOpenAddShopDialog(true);
    }

    const handleAddProduct = () => {
        setOpenAddProductDialog(true);
    }

    const handleClickShop = (shopId: string) => {
        setSelectedShopId(shopId);
        dispatch(fetchProducts(shopId));
    }


    const handleClickProduct = (productId: string) => {
        setThumbnailFile(undefined);
        setSelectedProductId(productId);
    }

    const handleSetThumbnail = (file: File | undefined) => {
        if (file === undefined) {
            // キャンセルを押したとき
            return;
        }

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
                productId: selectedProduct.id,
                rawProduct: {...selectedProduct, ...productForm},
                thumbnailFile: thumbnailFile
            })).then(() => {
                // TODO: 更新したProductだけ更新. ローカルでreducer回すだけでいいかも?
            });
            setThumbnailFile(undefined);
        }
    }

    const handleSubmitShop = (formData: AddShopFormType) => {
        setOpenAddShopDialog(false);
        dispatch(addShop({
            shopId: formData.id,
            shopForAdd: {
                display_name: formData.displayName,
                emg_message: "",
                baristas: {1: "active"},
                message: ""
            }
        }));
    }

    const handleSubmitProduct = async (id: string, formData: ProductFormType, file: File) => {
        setOpenAddProductDialog(false);
        await dispatch(addProduct({
            shopId: selectedShopId,
            productForAdd: {...formData, id},
            thumbnailFile: file
        })).unwrap();
        return;
    }

    return <React.Fragment>
        <Card sx={{border: "1px solid #837468", boxShadow: "none", margin: "1rem", overflow: 'auto'}}>
            {/*FIXME innerWidth参照で幅を変えてるのを直す 子の幅を親の幅に合わせたいが, overflow autoとdisplay inline-block だと上手くいかない (スクロールのためのこのcssは必要)*/}
            <DataView<Shop> contentSx={{display: "inline-block", width: window.innerWidth >= 1434 ? '100%' : 'auto'}}
                            selectorWidth={"14rem"}
                            selectorLabelProps={{icon: StorefrontOutlinedIcon, label: "店舗"}}
                            contentLabelProps={{icon: EditOutlinedIcon, label: selectedShop?.id ?? ''}}
                            addTextProps={{addLabel: "店舗を追加する", onClickAdd: handleAddShop}}
                            selectionData={shops}
                            selectionFunc={(shop) => {
                                return {
                                    label: shop.id,
                                    selected: shop.id === selectedShopId,
                                    onClick: () => handleClickShop(shop.id)
                                }
                            }}>
                {selectedShop !== undefined &&
                    <React.Fragment>
                        <Stack padding={"1.5rem"} spacing={3} alignItems={"flex-start"}>
                            <Stack direction={"row"} spacing={2}>
                                <LinkText>
                                    <Link to={`/${selectedShop.id}/admin`}>
                                        レジ
                                    </Link>
                                </LinkText>
                                <LinkText>
                                    <Link to={`/${selectedShop.id}/admin/barista`}>
                                        ドリップ
                                    </Link>
                                </LinkText>
                                <LinkText>
                                    <Link to={`/${selectedShop.id}/timer`}>
                                        タイマー
                                    </Link>
                                </LinkText>
                            </Stack>
                            <Typography variant={"h6"}>
                                店舗詳細
                            </Typography>
                            <Stack spacing={2} width={"100%"}>
                                <TextField label={"名前"} value={shopForm.display_name} id={"shop-display-name"}
                                           onChange={e => setShopForm({...shopForm, display_name: e.target.value})}
                                           sx={{width: "231px"}}/>
                                <MarkdownTextField label={"メッセージ"} value={shopForm.message}
                                                   helperText={"Markdownが使用可能です"} id={"shop-message"}
                                                   onChange={e => setShopForm({
                                                       ...shopForm,
                                                       message: e.target.value
                                                   })}
                                                   fullWidth/>
                            </Stack>
                            <Button variant={"contained"} disabled={!isShopChanged(shopForm)}
                                    onClick={handleUpdateShop}>
                                保存
                            </Button>
                        </Stack>
                        <ProductDataView products={products}
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
            </DataView>
        </Card>
        <AddShopDialog open={openAddShopDialog}
                       onClose={() => setOpenAddShopDialog(false)}
                       onSubmit={handleSubmitShop}
                       shops={shops}/>
        <AddProductDialog open={openAddProductDialog}
                          onClose={() => setOpenAddProductDialog(false)}
                          products={products}
                          onSubmit={handleSubmitProduct}/>
    </React.Fragment>
}

const ProductDataView = (props: {
    products: Product[],
    onAddProduct: () => void,
    selectedProductId: string,
    onClickProduct: (productId: string) => void,
    isThumbnailError: boolean,
    productForm: ProductFormType,
    setProductForm: (newProductForm: ProductFormType) => void;
    selectedProduct: Product | undefined,
    isProductFormChanged: boolean,
    thumbnailFile: File | undefined,
    setThumbnail: (file: File | undefined) => void,
    onUpdateProduct: () => void,
}) => {
    const {
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

    useEffect(() => {
        if (thumbnailFile === undefined && selectedProduct !== undefined) {
            setThumbnailUrl(selectedProduct.thumbnail_url);
        } else if (thumbnailFile !== undefined) {
            setThumbnailUrl(window.URL.createObjectURL(thumbnailFile))
        }

    }, [thumbnailFile, selectedProduct]);

    const handleFileChange = (files: FileList | null) => {
        if (files) {
            setThumbnail(files[0]);
        }
    }

    return <DataView<Product> contentSx={{width: "100%"}}
                              selectorLabelProps={{icon: CoffeeOutlinedIcon, label: "商品"}}
                              contentLabelProps={{icon: EditOutlinedIcon, label: selectedProduct?.id ?? ''}}
                              addTextProps={{addLabel: "商品を追加する", onClickAdd: () => onAddProduct()}}
                              selectionData={products}
                              selectionFunc={(prod) => {
                                  return {
                                      label: prod.id,
                                      selected: prod.id === selectedProductId,
                                      onClick: () => onClickProduct(prod.id)
                                  }
                              }}>
        {selectedProduct !== undefined &&
            <Stack padding={"1rem 1.5rem"} spacing={3} alignItems={"flex-start"} paddingBottom={"5rem"}>
                <Stack direction={"row"} spacing={3}>
                    <Stack spacing={3} minWidth={500}>
                        <Typography variant={"h6"}>
                            商品詳細
                        </Typography>
                        <Stack direction={"row"} spacing={2}>
                            <Stack spacing={2}>
                                <TextField label={"名前"} value={productForm.display_name}
                                           id={"product-display-name"}
                                           onChange={e => setProductForm({
                                               ...productForm,
                                               display_name: e.target.value
                                           })}/>
                                <TextField label={"略称"} value={productForm.shorter_name}
                                           id={"product-shorter-name"}
                                           onChange={e => setProductForm({
                                               ...productForm,
                                               shorter_name: e.target.value
                                           })}/>
                            </Stack>
                            <Stack spacing={2}>
                                <TextField label={"値段"} value={productForm.price} type={"number"}
                                           id={"product-price"}
                                           InputProps={{
                                               startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                                           }}
                                           onChange={e => setProductForm({
                                               ...productForm,
                                               price: Number(e.target.value)
                                           })}/>
                                <TextField label={"制作時間"} value={productForm.span} type={"number"}
                                           id={"product-span"}
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
                    <Stack spacing={3} minWidth={"260px"}>
                        <Typography variant={"h6"}>
                            サムネイルを編集
                        </Typography>
                        <Stack direction={"row"} spacing={1}>
                            <img style={{width: 120, height: 120, borderRadius: 10}}
                                 src={thumbnailUrl}
                                 alt={`thumbnail`}/>
                            <Stack spacing={1} width={"100%"} alignItems={"flex-start"}>
                                <FileInputButton onFileChanged={handleFileChange}/>
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
    </DataView>
}

export default AdminPage;