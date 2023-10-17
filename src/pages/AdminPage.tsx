import React, {useEffect, useState} from "react";
import {
    Button,
    ButtonBase,
    Card,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    InputAdornment,
    Link as LinkText,
    Stack,
    Typography
} from "@mui/material";
import {useAppDispatch} from "../modules/redux/store";
import {useSelector} from "react-redux";
import {addShop, fetchShops, selectAllShops, selectShopStatus, updateShop} from "../modules/redux/shop/shopsSlice";
import styled from "styled-components";
import TextField from "@mui/material/TextField";
import {Shop} from "../modules/redux/shop/shopTypes";
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import {Product} from "../modules/redux/product/productTypes";
import {
    addProduct,
    fetchProducts,
    selectAllProduct,
    selectProductStatus,
    updateProduct
} from "../modules/redux/product/productsSlice";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import FileInputButton from "../components/FileInputButton";
import {Link} from "react-router-dom";
import MarkdownTextField from "../components/MarkdownTextField";
import DataView from "../components/admin/DataView";

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
                            addTextProps={{addLabel: "店舗を追加する", onClickAdd: handleAddProduct}}
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

type AddShopFormType = { id: string, displayName: string };

const AddShopDialog = (props: {
    open: boolean,
    onClose: () => void,
    onSubmit: (shop: AddShopFormType) => void,
    shops: Shop[]
}) => {
    const [id, setId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [clickedSubmit, setClickedSubmit] = useState(false);

    const {open, onClose, onSubmit, shops} = props;

    const isIdDuplicated = shops.map(s => s.id).includes(id);
    const isValidId = id !== '' && !isIdDuplicated;
    const isValidDisplayName = displayName !== '';

    useEffect(() => {
        if (!open) {
            // 初期化
            setId('');
            setDisplayName('');
        }
    }, [open]);

    const handleSubmit = () => {
        if (isValidId && isValidDisplayName) {
            onSubmit({id, displayName});
        } else {
            setClickedSubmit(true);
        }
    }

    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>
            店舗を追加する
        </DialogTitle>
        <DialogContent>
            <Stack spacing={0.5}>
                <TextField variant={"filled"}
                           label={"id"}
                           id={"shop-id"}
                           helperText={clickedSubmit && id === '' ? "IDを入力してください" :
                               clickedSubmit && isIdDuplicated ? "IDが重複しています" : "一度決めたIDは変更できません"}
                           value={id} onChange={e => setId(e.target.value)}
                           required error={clickedSubmit && !isValidId}/>
                <TextField variant={"filled"}
                           label={"店名"}
                           id={"shop-display-name"}
                           helperText={clickedSubmit && !isValidDisplayName ? "店名を入力してください" : " "}
                           value={displayName} onChange={e => setDisplayName(e.target.value)}
                           required error={clickedSubmit && !isValidDisplayName}/>
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>
                キャンセル
            </Button>
            <Button onClick={handleSubmit}>
                追加
            </Button>
        </DialogActions>
    </Dialog>
}

const AddProductDialog = (props: {
    open: boolean,
    onClose: () => void,
    products: Product[],
    onSubmit: (id: string, formData: ProductFormType, file: File) => Promise<void>;
}) => {
    const {open, onClose, products, onSubmit} = props;

    const [step, setStep] = useState<"product_info" | "set_thumbnail">("product_info");
    const [id, setId] = useState('');
    const [display_name, setDisplayName] = useState('');
    const [shorter_name, setShorterName] = useState('');
    const [price, setPrice] = useState(0);
    const [span, setSpan] = useState(0);
    const [thumbnail, setThumbnail] = useState<File | undefined>(undefined);
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [isClickedNext, setIsClickedNext] = useState(false);
    const [isClickedSubmit, setIsClickedSubmit] = useState(false);

    const isIdDuplicated = products.map(s => s.id).includes(id);
    const isValidId = id !== '' && !isIdDuplicated;
    const isValidDisplayName = display_name !== '';
    const isValidShorterName = shorter_name !== '';

    const handleSelectThumbnail = (files: FileList | null) => {
        if (files !== null) {
            const file = files[0];
            setThumbnail(file);
            setThumbnailUrl(window.URL.createObjectURL(file));
        }
    }

    const handleCancel = () => {
        if (step === "product_info") {
            onClose()
        } else {
            setStep("product_info")
            setIsClickedSubmit(false)
        }
    }

    const handleNext = async () => {
        if (step === "product_info") {
            setIsClickedNext(true);
            if (isValidId && isValidDisplayName) {
                setStep("set_thumbnail");
            }
        } else {
            if (thumbnail !== undefined) {
                await onSubmit(id, {display_name, price, span, shorter_name}, thumbnail)
                onClose();

                // state を初期化
                setIsClickedSubmit(false);
                setIsClickedNext(false);
                setStep('product_info');
                setId('');
                setDisplayName('')
                setShorterName('')
                setSpan(0)
                setPrice(0)
                setThumbnail(undefined)
                setThumbnailUrl('')

            } else {
                setIsClickedSubmit(true);
            }
        }
    }

    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>
            {step === "product_info" ? "商品情報を入力する" : "サムネイルを設定する"}
        </DialogTitle>
        <DialogContent>
            {step === "product_info" &&
                <Stack spacing={0.5}>
                    <TextField variant={"filled"}
                               label={"id"}
                               id={"product-id"}
                               helperText={isClickedNext && id === '' ? "IDを入力してください" :
                                   isClickedNext && isIdDuplicated ? "IDが重複しています" : "一度決めたIDは変更できません"}
                               value={id} onChange={e => setId(e.target.value)}
                               required error={isClickedNext && !isValidId}/>
                    <TextField variant={"filled"}
                               label={"商品名"}
                               id={"product-display-name"}
                               helperText={isClickedNext && !isValidDisplayName ? "商品名を入力してください" : " "}
                               value={display_name} onChange={e => setDisplayName(e.target.value)}
                               required error={isClickedNext && !isValidDisplayName}/>
                    <TextField variant={"filled"}
                               label={"略称"}
                               id={"product-shorter-name"}
                               helperText={isClickedNext && !isValidShorterName ? "略称を入力してください" : " "}
                               value={shorter_name} onChange={e => setShorterName(e.target.value)}
                               required error={isClickedNext && !isValidShorterName}/>
                    <TextField variant={"filled"}
                               label={"値段"}
                               helperText={" "}
                               id={"product-price"}
                               type={"number"}
                               aria-valuemin={0}
                               InputProps={{
                                   startAdornment: <InputAdornment position="start">¥</InputAdornment>,
                               }}
                               value={price}
                               onChange={e => setPrice(Number(e.target.value))}
                               required/>
                    <TextField variant={"filled"}
                               label={"制作時間"}
                               helperText={" "}
                               id={"product-span"}
                               type={"number"}
                               aria-valuemin={0}
                               InputProps={{
                                   endAdornment: <InputAdornment position="end">秒</InputAdornment>,
                               }}
                               value={span}
                               onChange={e => setSpan(Number(e.target.value))}
                               required/>
                </Stack>
            }
            {step === "set_thumbnail" &&
                <Stack spacing={1}>
                    <DialogContentText>
                        正方形のPNGまたはJPG画像を選択してください
                    </DialogContentText>
                    <FileInputButton onFileChanged={handleSelectThumbnail}/>
                    {thumbnail !== undefined &&
                        <img style={{width: 120, height: 120, borderRadius: 10}}
                             src={thumbnailUrl}
                             alt={`thumbnail`}/>
                    }
                    {isClickedSubmit && thumbnail === undefined &&
                        <DialogContentText color={'#BA1A1A'}>
                            サムネイルを設定してください
                        </DialogContentText>
                    }
                </Stack>
            }
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCancel}>
                {step === "product_info" ? "キャンセル" : "もどる"}
            </Button>
            <Button onClick={handleNext}>
                {step === "product_info" ? "次へ" : "追加"}
            </Button>
        </DialogActions>
    </Dialog>
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