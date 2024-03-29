import {ReactNode} from "react";
import {AnimatePresence, motion, MotionStyle, useIsPresent} from "framer-motion";

export const MotionList = (props: { children: ReactNode, layoutId: string, style?: MotionStyle }) => {
    // return <ul>
    //     {props.children}
    // </ul>;

    return <motion.ul layout layoutId={props.layoutId} style={props.style}>
        {props.children}
    </motion.ul>
}

export const MotionListItem = (props: { children: ReactNode, spacing?: number }) => {
    const isPresent = useIsPresent();

    const animations = {
        initial: {x: -100, opacity: 0},
        animate: {x: 0, opacity: 1},
        exit: {x: 100, opacity: 0},
        transition: {type: "spring", stiffness: 600, damping: 40}
    }

    return <motion.li
        layout
        {...animations}
        style={{
            position: isPresent ? "static" : "absolute"
        }}
    >
        <AnimatePresence>
            {props.children}
        </AnimatePresence>
    </motion.li>
};