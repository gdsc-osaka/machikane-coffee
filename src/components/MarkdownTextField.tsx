import TextField from "@mui/material/TextField";
import {TextFieldProps, TextFieldVariants} from "@mui/material/TextField/TextField";

export default function MarkdownTextField<Variant extends TextFieldVariants>(props: {
    variant?: Variant;
} & Omit<TextFieldProps, 'variant'>) {
    return <TextField {...props}
                      inputProps={{style: {fontFamily: "Consolas, monaco, monospace", fontSize: "0.8rem", lineHeight: "180%"}}}
                      multiline/>
}