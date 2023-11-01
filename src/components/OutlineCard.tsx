import styled from "styled-components";
import {ReactNode} from "react";
import {Typography} from "@mui/material";

export const OutlineCard = styled.div`
  border-radius: 10px;
  border-color: #D5C3B5;
  border-width: thin;
  width: 100%;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const CaptionCard = (props: {children: ReactNode}) => {
    return <OutlineCard>
        <Typography variant={"body1"} sx={{color: (theme) => theme.typography.caption.color}}>
            {props.children}
        </Typography>
    </OutlineCard>
}