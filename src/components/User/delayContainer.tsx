import { VFC } from "react";
import React from "react";
import { Order } from "../../modules/redux/order/types";

type Props = {
    orders: Array<Order>
}

const DelayContainer = () => {
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
                提供が5分遅延しています
            </div>
            <div style={supportingTextStyle}>
                材料不足やその他の原因で提供を一時停止しております。復旧の目処が立ち次第、提供を開始させていただきますので何卒よろしくお願いいたします。
            </div>
        </div>
    );
}

export default DelayContainer;