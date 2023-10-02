import { VFC } from "react";
import React from "react";


type Props = {
    delayMinutes: number,
    emg_message: string | undefined,
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
    return(
        <div style={delayContainerStyle}>
            <div style={headLineStyle}>
                提供が{props.delayMinutes}分遅延しています
            </div>
            <div style={supportingTextStyle}>
                {props.emg_message ?? ""}
            </div>
        </div>
    );
}

export default DelayContainer;