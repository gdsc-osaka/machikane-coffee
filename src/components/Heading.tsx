import {ReactNode} from "react";
import {Divider, Typography} from "@mui/material";

export default function Heading(props: {
    children: ReactNode
}) {
    return <>
        <Typography variant={'h5'}>
            {props.children}
        </Typography>
        <Divider sx={{marginTop: "0.5rem", marginBottom: "1rem"}}/>
    </>
}