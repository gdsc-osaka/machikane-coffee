import React, {ReactNode} from "react";
import {MotionList} from "../motion/motionList";
import {NeumoContainer} from "../neumo";

const OrdersList = (props: {
    children: ReactNode,
    key: string,
    grid: number,
}) => {
    const {children, key, grid} = props;
    const gridTemplateColumns = '1fr '.repeat(grid);

    return <NeumoContainer key={`${key}-container`}>
        <MotionList layoutId={key}
                    style={{
                        display: 'grid', flexDirection: 'column', gap: '1rem',
                        gridTemplateColumns: gridTemplateColumns
                    }}>
            {children}
        </MotionList>
    </NeumoContainer>
}

export default OrdersList;