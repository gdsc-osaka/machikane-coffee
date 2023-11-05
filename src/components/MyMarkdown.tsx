import Markdown, {Options} from "react-markdown";
import {Link, Typography} from "@mui/material";
import UnderlineDivider from "./UnderlineDivider";

const MyMarkdown = (props: {children: string | null | undefined, options?: Readonly<Options>}) => {
    return <Markdown {...props} components={{
        h1(props) {
            const {children} = props;

            return <Typography variant={"h4"} fontWeight={"bold"} sx={{marginTop: "1.5rem"}}>
                {children}
                <UnderlineDivider/>
            </Typography>
        },
        h2(props) {
            const {children} = props;

            return <Typography variant={"h5"} fontWeight={"bold"} sx={{marginTop: "1.5rem"}}>
                {children}
                <UnderlineDivider/>
            </Typography>
        },
        h3(props) {
            const {children} = props;

            return <Typography variant={"h6"} fontWeight={"bold"} sx={{lineHeight: "200%", marginTop: "1.5rem"}}>
                {children}
            </Typography>
        },
        p(props) {
            const {children} = props;

            return <Typography variant={"body1"} sx={{lineHeight: "200%"}}>
                {children}
            </Typography>
        },
        a(props) {
            return <Link href={props.href} target={"_blank"} sx={{lineHeight: "200%"}}>
                {props.children}
            </Link>
        },
        ul(props) {
            return <ul style={{listStyle: "initial"}}>
                {props.children}
            </ul>
        },
        ol(props) {
            return <ol style={{listStyleType: "decimal"}}>
                {props.children}
            </ol>
        },
        li(props) {
            return <li style={{paddingLeft: "1rem", listStylePosition: "inside"}}>
                {props.children}
            </li>
        }
    }} >
        {props.children}
    </Markdown>
}

export default MyMarkdown;