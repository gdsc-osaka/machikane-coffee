import {motion, MotionStyle} from "framer-motion";
import styled from "styled-components";

const MotionDividerTemplate = styled(motion.hr)`
  border-bottom-width: 1;
  border-style: solid;
  flex-shrink: 0;
  margin: 0 0 0 auto;
`

export function MotionDivider(props: {style: MotionStyle, width?: string}) {
    return <MotionDividerTemplate transition={{ ease: "linear", duration: 1 }}
                                  animate={{
                                      width: props.width
                                  }}
                                  style={props.style}/>
}