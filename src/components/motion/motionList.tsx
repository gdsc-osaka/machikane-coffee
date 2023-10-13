import {ReactNode} from "react";
import {useTheme} from "@mui/material";
import {AnimatePresence, motion, useIsPresent} from "framer-motion";

export const MotionList = (props: {children: ReactNode, layoutId: string}) => {
    // return <ul>
    //     {props.children}
    // </ul>;

    return <motion.ul layout layoutId={props.layoutId}>
        {props.children}
    </motion.ul>
}

export const MotionListItem = (props: {children: ReactNode, key: string, spacing?: number}) => {
    const theme = useTheme();
    const isPresent = useIsPresent();

    const animations = {
        initial: { x:-100, opacity: 0 },
        animate: { x:0, opacity: 1 },
        exit: { x:100, opacity: 0 },
        transition: { type: "spring", stiffness: 600, damping: 40 }
    }

    return <motion.li
        layout
        {...animations}
        key={props.key}
        style={{marginBottom: theme.spacing(props.spacing ?? 2), position: isPresent ? "static" : "absolute"}}
    >
        <AnimatePresence>
            {props.children}
        </AnimatePresence>
    </motion.li>
};