import styled from "styled-components";
import {motion} from "framer-motion";
import {ReactNode} from "react";

const NeumoMotionDiv = styled(motion.div)`
  border-radius: 50px;
  box-shadow:  10px 10px 30px #d9d5d9,
    -10px -10px 30px #ffffff;
  padding: 20px;
`

export const NeumoContainer = (props: { children: ReactNode, key: string }) => {
    const {children, key} = props;

    return (
        <NeumoMotionDiv layout key={key} style={{ height: "auto" }} transition={{type: "spring", stiffness: 600, damping: 40}}>
            {children}
        </NeumoMotionDiv>
    )
}