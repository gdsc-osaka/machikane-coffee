import {ReactNode} from "react";
import styled from "styled-components";

const Container = styled.div<{ color: string }>`
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  background-color: ${(props) => props.color};
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 0 0;
`

const FoldIcon = (props: {color: string}) => {
    return <div style={{width: "3rem", height: "3rem", marginLeft: "-2rem", zIndex: 2}}>
        <svg viewBox="-4 4 33 33" fill="none">
            <g filter="url(#filter0_d_54558_1552)">
                <path d="M5 3V28H30L5 3Z" fill={props.color}/>
            </g>
            <path d="M30 28V3H5L30 28Z" fill="#FFFBFF"/>
            <defs>
                <filter id="filter0_d_54558_1552" x="0" y="0" width="33" height="33" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                    <feOffset dx="-1" dy="1"/>
                    <feGaussianBlur stdDeviation="2"/>
                    <feComposite in2="hardAlpha" operator="out"/>
                    <feColorMatrix type="matrix" values="0 0 0 0 0.615686 0 0 0 0 0.556863 0 0 0 0 0.505882 0 0 0 0.3 0"/>
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_54558_1552"/>
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_54558_1552" result="shape"/>
                </filter>
            </defs>
        </svg>
    </div>
}

type StickyNoteContainerProps = {
    children?: ReactNode,
    variant?: "surface" | "surface-variant"
}

const StickyNote = (props: StickyNoteContainerProps) => {
    const color = props.variant == "surface-variant" ? "#F7ECE5" : "#FFF8F5";
    return <Container color={color}>
        <Column>
            {props.children}
        </Column>
        <FoldIcon color={color}/>
    </Container>
}

export default StickyNote