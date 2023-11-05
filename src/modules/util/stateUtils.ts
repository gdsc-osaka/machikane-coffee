export type DialogState = {
    open: boolean,
    title: string,
    description: string,
    onOk: () => void,
}

export const initialDialogState: DialogState = {
    open: false,
    title: "",
    description: "",
    onOk: () => {
    }
};