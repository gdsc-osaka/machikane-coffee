import styled from "styled-components";
import {motion} from "framer-motion";
import {ReactNode} from "react";

type NeumoType = 'flat' | 'pressed';

const NeumoMotionDiv = styled(motion.div)<{ type?: NeumoType }>`
  border-radius: 50px;
  box-shadow: ${(props) => props.type === 'pressed' ? 'inset' : ''} 10px 10px 30px #d9d5d9,
    ${(props) => props.type === 'pressed' ? 'inset' : ''} -10px -10px 30px #ffffff;
  padding: 20px;
  background-color: #FFFBFF;
`
const NeumoDiv = styled.div<{ type?: NeumoType }>`
  border-radius: 50px;
  box-shadow: ${(props) => props.type === 'pressed' ? 'inset' : ''} 10px 10px 30px #d9d5d9,
    ${(props) => props.type === 'pressed' ? 'inset' : ''} -10px -10px 30px #ffffff;
  padding: 20px;
  background-color: #FFFBFF;
`

export const NeumoContainer = (props: { children: ReactNode, type?: NeumoType }) => {
    const {children, type} = props;

    return <NeumoDiv type={type}>
        {children}
    </NeumoDiv>

    return (
        <NeumoMotionDiv layout style={{height: "auto"}}
                        type={type}
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{type: "spring", stiffness: 600, damping: 40}}>
            {children}
        </NeumoMotionDiv>
    )
}