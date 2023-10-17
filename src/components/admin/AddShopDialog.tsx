import {Shop} from "../../modules/redux/shop/shopTypes";
import React, {useEffect, useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack} from "@mui/material";
import TextField from "@mui/material/TextField";

export type AddShopFormType = { id: string, displayName: string };

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

export default AddShopDialog;