import { VFC } from "react";
import React from "react";
import { Order } from "../../modules/redux/order/types";

type Props = {
    orders: Array<Order>
}

const WaitForReceive: VFC<Props> = (props) => {
    const containerStyle = {
        display: 'flex',
        paddingLeft: '0px',
        alignItems: 'center',
        gap: '10px',
    }
    const textStyle = {
        color: '#000',
        // textAlign: 'center',
        fontFamily: 'Roboto',
        fontSize: '14px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '20px', /* 142.857% */
        letterSpacing: '0.1px',
    }
    const circleStyle = {
        display: 'flex',
        width: '32px',
        height: '32px',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '100px',
        background: 'var(--m-3-sys-light-surface-container, #F7ECE5)',
        color: 'var(--m-3-sys-light-on-surface, #201B16)',
        // textAlign: 'center',
        fontFamily: 'Roboto',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '700',
        lineHeight: '24px', /* 150% */
        letterSpacing: '0.15px',
    }
    return(
        <div style={containerStyle}>
            {props.orders.length != 0 ? (
                <div style={containerStyle}>
                    <div style={textStyle}>受け取り待ち</div>
                    {props.orders.map((order) => {
                        return <div style={circleStyle}>{order.index}</div>
                    })}
                </div>
            ) : (
                <></>
            )}
        </div>
    );
}

export default WaitForReceive;