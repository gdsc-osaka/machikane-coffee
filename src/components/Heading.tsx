import {ReactNode} from "react";
import {Divider, Typography} from "@mui/material";

export default function Heading(props: {
    children: ReactNode,
    variant?: "main" | "sub"
}) {
    return <>
        <Typography variant={props.variant === "sub" ? "h6" : 'h5'}>
            {props.children}
        </Typography>
        <Divider sx={{marginTop: "0.5rem", marginBottom: "1rem"}}/>
    </>
}