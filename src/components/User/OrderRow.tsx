import { VFC } from "react";
import { Order } from "../../modules/redux/order/types";
import { TableRow, TableCell } from "@mui/material";
// import { selectProductById } from "../../modules/redux/product/productsSlice";
// import { RootState } from "../../modules/redux/store";

type Props = {
    order: Order
}

const OrderRow: VFC<Props> = (props) => {
    const order = props.order;
    const completeAt = order.complete_at.seconds as unknown as number;
    const currentTime = new Date().getTime() / 1000;
    const waitTime = Math.floor((completeAt - currentTime + order.delay_seconds) / 60);
    let message;

    const orderItemStyles = {
        display: 'flex',
        alignSelf: 'stretch',
        alignItems: 'center',
        backgroundColor: '#F7ECE5',
    };
    

    const contentStyles = {
        display: 'flex',
        padding: '6px 10px',
        alignItems: 'center',
        gap: '10px',
    };

    const indexStyles = {
        display: 'flex',
        width: '24px',
        height: '27px',
        // flexDirection: 'column',
        justifyContent: 'center',
        color: 'var(--m-3-sys-light-on-surface, #201B16)',
        // textAlign: 'center',
        fontFamily: 'Roboto',
        fontSize: '16px',
        fontStyle: 'normal',
        fontWeight: '700',
        lineHeight: '24px', /* 150% */
        letterSpacing: '0.15px',
    };

    const productNameColumnStyles = {
        display: 'flex',
        width: '170px',
        padding: '8px 0px',
        // flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '8px',
        alignSelf: 'stretch',
    };

    const messageContainerStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        alignSelf: 'stretch',
        color: 'var(--m-3-black, #000)',
        fontFamily: 'Roboto',
        fontSize: '12px',
        fontStyle: 'normal',
        fontWeight: '500',
        lineHeight: '21px', /* 175% */
    };

    const foldContainerStyles = {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        gap: '10px',
        flex: '1 0 0',
        alignSelf: 'stretch',
    }
    // const verticalFullWidth = {
    //     display: 'flex',
    //     // flexDirection: 'column',
    //     alignItems: 'center',
    //     alignSelf: 'stretch',
    // }
    const verticalBar = {
        width: '1px',
        height: '50px',
        backGroundColor: 'black',
        color: 'black',
        zIndex: '6',
    }
    
    if(order.status === "completed"){
        message = 'できあがりました';
    }
    else if(waitTime < 2) {
        message = 'まもなく完成します';
    }
    else{
        message = 'あと約' + waitTime + '分';
    }
    return(
        <TableRow>
            <TableCell>
            <div style={orderItemStyles}>
                <div style={contentStyles}>
                    <div style={indexStyles}>{order.index}</div>
                    
                    <div style={verticalBar} /> 
                    
                    <div style={productNameColumnStyles}></div>
                    <div style={verticalBar} />
                    <div style={messageContainerStyles}>{message}</div>
                </div>
                <div style={foldContainerStyles}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="33" height="33" viewBox="0 0 33 33" fill="none">
                        <g filter="url(#filter0_d_54617_1046)">
                        <path d="M5 3V28H30L5 3Z" fill="#F7ECE5"/>
                        </g>
                        <path d="M30 28V3H5L30 28Z" fill="#FFFBFF"/>
                        <defs>
                        <filter id="filter0_d_54617_1046" x="0" y="0" width="33" height="33" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dx="-1" dy="1"/>
                        <feGaussianBlur stdDeviation="2"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0.615686 0 0 0 0 0.556863 0 0 0 0 0.505882 0 0 0 0.3 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_54617_1046"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_54617_1046" result="shape"/>
                        </filter>
                        </defs>
                        </svg>
                    </div>
            </div>
            </TableCell>
        </TableRow>
    );
}

export default OrderRow;
  