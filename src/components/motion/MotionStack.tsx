import { motion } from "framer-motion"
import {useTheme} from "@mui/material";
import {ReactNode} from "react";

const MotionStack = (props: {
    direction: 'row' | 'column',
    alignItems: 'stretch',
    spacing: number,
    key: string,
    children: ReactNode
}) => {
    const {
        direction, alignItems, spacing,
        children, key
    } = props;
    const theme = useTheme();

    return <motion.div key={key} layout transition={{type: "spring", stiffness: 600, damping: 40}}
                       style={{
                           height: 'auto',
                           display: 'flex',
                           flexDirection: direction,
                           alignItems: alignItems,
                           gap: theme.spacing(spacing)
                       }}>
        {children}
    </motion.div>
}

export default MotionStack