import {ReactNode} from "react";
import styled from "styled-components";
import {Stack} from "@mui/material";
import {ResponsiveStyleValue, SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";
import {motion} from "framer-motion";

const Container = styled.div<{ color: string }>`
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  background-color: ${(props) => props.color};
`

const AnimationContainer = styled(motion.div)<{ color: string }>`
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  background-color: ${(props) => props.color};
`

const FoldIcon = (props: { color: string }) => {
    return <div style={{width: "2rem", height: "2rem", marginLeft: "-1.8rem", zIndex: 2}}>
        <svg viewBox="-4 4 33 33" fill="none">
            <g filter="url(#filter0_d_54558_1552)">
                <path d="M5 3V28H30L5 3Z" fill={props.color}/>
            </g>
            <path d="M30 28V3H5L30 28Z" fill="#FFFBFF"/>
            <defs>
                <filter id="filter0_d_54558_1552" x="0" y="0" width="33" height="33" filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                                   result="hardAlpha"/>
                    <feOffset dx="-1" dy="1"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix"
                                   values="0 0 0 0 0.615686 0 0 0 0 0.556863 0 0 0 0 0.505882 0 0 0 0.3 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_54558_1552"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_54558_1552" result="shape"/>
                </filter>
            </defs>
        </svg>
    </div>
}

type StickyNoteContainerProps = {
    children?: ReactNode,
    variant?: "surface" | "surface-variant",
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse',
    spacing?: ResponsiveStyleValue<number | string>,
    sx?: SxProps<Theme>,
    animation?: boolean,
    key?: string,
}

const StickyNote = (props: StickyNoteContainerProps) => {
    const {
        children,
        sx,
        spacing,
        variant,
        direction,
        animation,
        key
    } = props;

    const color = variant === "surface-variant" ? "#F7ECE5" : "#FFF8F5";
    const child = <>
        <Stack sx={{width: "100%", ...sx}} direction={direction ?? 'column'} spacing={spacing}>
            {children}
        </Stack>
        <FoldIcon color={color}/>
    </>

    if (animation) {
        return <AnimationContainer layout key={key}
                                   color={color} style={{height: "auto"}}
                                   transition={{ease: 'linear'}}>
            {child}
        </AnimationContainer>
    } else {
        return <Container color={color}>
            {child}
        </Container>
    }
}

export default StickyNote