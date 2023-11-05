import {Button} from "@mui/material";
import React, {useRef} from "react";

const FileInputButton = (props: {
    onFileChanged: (file: FileList | null) => void,
}) => { // & ButtonProps & React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.onFileChanged(event.target.files)
    }

    return <Button variant={"outlined"}
                   onClick={_ => fileInputRef.current?.click()}>
        ファイルを選択
        <input
            hidden
            name="thumbnail"
            type="file"
            accept=".png,.jpg"
            ref={fileInputRef}
            onChange={handleFileChange}
        />
    </Button>
}

export default FileInputButton;