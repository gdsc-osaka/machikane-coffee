import { Button } from "@mui/material";
import { VFC } from "react";
import React from "react";


type Props = {
    delayMinutes: number,
    emg_message: string | undefined,
    buttonClicked: () => void
}

const DelayContainer:  VFC<Props> = (props) => {
    const delayContainerStyle = {
        display: 'flex',
        padding: '24px',
        flexDirection: 'column' as 'column',
        alignItems: 'flex-start',
        gap: '16px',
        borderRadius: '20px',
        background: 'var(--m-3-sys-light-error-container, #FFDAD6)',
    }
    const headLineStyle = {
        color: 'var(--m-3-sys-light-on-error-container, #410002)',
        fontFamily: 'Roboto',
        fontSize: '24px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: '32px',
    }
    const supportingTextStyle = {
        color: 'var(--m-3-sys-light-on-surface-variant, #51453A)',
        fontFamily: 'Roboto',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: '20px',
        letterSpacing: '0.25px',
    }
    const buttonStyle = {
        display: 'flex',
        flexDirection: 'column' as 'column',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: '10px',
        alignSelf: 'stretch',
    }
    const buttonFontStyle = {
        color: 'var(--m-3-sys-light-on-error-container, #410002)',
        textAlign: 'center' as 'center', 
        fontFamily: 'Roboto',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '20px', /* 142.857% */
        letterSpacing: '0.1px',
    }
 
    return(
        <div style={delayContainerStyle}>
            <div style={headLineStyle}>
                提供が{props.delayMinutes}分遅延しています
            </div>
            <div style={supportingTextStyle}>
                {props.emg_message ?? ""}
            </div>
            {/* <button style={buttonStyle} onClick={props.buttonClicked}>今後表示しない</button> */}
            <div style={buttonStyle}>
                <Button
                    onClick={props.buttonClicked}
                    variant="outlined"
                >
                    <div style={buttonFontStyle}>今後表示しない</div>
                </Button>
            </div>
        </div>
    );
}

export default DelayContainer;