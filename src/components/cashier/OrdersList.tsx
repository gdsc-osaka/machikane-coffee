import React, {ReactNode} from "react";
import {MotionList} from "../motion/motionList";
import {NeumoContainer} from "../neumo";

const OrdersList = (props: {
    children: ReactNode,
    grid: number,
    layoutId: string,
}) => {
    const {children, grid, layoutId} = props;
    const gridTemplateColumns = '1fr '.repeat(grid);

    return <NeumoContainer>
        <MotionList layoutId={layoutId}
                    style={{
                        display: 'grid', flexDirection: 'column', gap: '1rem',
                        gridTemplateColumns: gridTemplateColumns
                    }}>
            {children}
        </MotionList>
    </NeumoContainer>
}

export default OrdersList;