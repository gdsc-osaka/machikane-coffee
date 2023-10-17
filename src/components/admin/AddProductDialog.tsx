import {Product} from "../../modules/redux/product/productTypes";
import React, {useState} from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    InputAdornment,
    Stack
} from "@mui/material";
import TextField from "@mui/material/TextField";
import FileInputButton from "../FileInputButton";

export type ProductFormType = {
    display_name: string;
    span: number;
    price: number;
    shorter_name: string;
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

export default AddProductDialog