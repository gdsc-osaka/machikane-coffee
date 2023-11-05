import {Button, ButtonBase, Divider, Stack, Typography} from "@mui/material";
import React, {ReactNode} from "react";
import styled from "styled-components";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import {SxProps} from "@mui/system";
import {Theme} from "@mui/material/styles/createTheme";

type DataViewProps<D> = {
    children?: ReactNode,
    selectorLabelProps: ViewLabelProps,
    contentLabelProps: ViewLabelProps,
    addTextProps: AddTextProps,
    selectionData: D[],
    selectionFunc: (data: D) => SelectionItemProps,
    selectorWidth?: string,
    contentSx?: SxProps<Theme>,
}

const DataView = <D,>(props: DataViewProps<D>) => {
    const {
        children,
        selectorLabelProps,
        contentLabelProps,
        addTextProps,
        selectionData,
        selectionFunc,
        selectorWidth,
        contentSx
    } = props;

    const selectionProps = selectionData.map(selectionFunc);

    return <Stack direction={"row"}>
        <Stack minWidth={selectorWidth ?? "18rem"}>
            <ViewLabel icon={selectorLabelProps.icon} label={selectorLabelProps.label}/>
            <AddTextButton addLabel={addTextProps.addLabel} onClickAdd={addTextProps.onClickAdd}/>
            {selectionProps.map(prop => <SelectionItem label={prop.label}
                                                 selected={prop.selected}
                                                       key={prop.label}
                                                 onClick={prop.onClick}/>)}
        </Stack>
        <DataDivider orientation={"vertical"} flexItem/>
        <Stack sx={contentSx}>
            <ViewLabel icon={contentLabelProps.icon} label={contentLabelProps.label}/>
            {children}
        </Stack>
    </Stack>
}

const DataDivider = styled(Divider)`
  border-color: #D5C3B5;
`

type ViewLabelProps = {
    icon: React.FunctionComponent<{ sx: SxProps<Theme> }>,
    label: string
}

const ViewLabel = (props: ViewLabelProps) => {
    return <Stack direction={"row"} spacing={1} padding={"0.75rem"} alignItems={"center"} justifyContent={"flex-start"}
                  sx={{backgroundColor: '#F2DFD1'}}>
        <props.icon sx={{color: '#51453A'}}/>
        <Typography variant={"body1"} color={'#51453A'}>
            {props.label}
        </Typography>
    </Stack>
}

type AddTextProps = { addLabel: string, onClickAdd: VoidFunction };

const AddTextButton = (props: AddTextProps) => {
    const {addLabel, onClickAdd} = props;
    return <Button variant={"text"}
                   startIcon={<AddRoundedIcon/>}
                   onClick={onClickAdd}
                   sx={{borderRadius: 0, justifyContent: "flex-start", height: "2.5rem", paddingLeft: "1.2rem"}}>
        {addLabel}
    </Button>
}

type SelectionItemProps = { label: string, selected: boolean, onClick: VoidFunction };

const SelectionItem = (props: SelectionItemProps) => {
    return <ButtonBase onClick={props.onClick}>
        <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"} paddingLeft={"2.8rem"}
               paddingRight={"1.2rem"}
               sx={{backgroundColor: props.selected ? '#F8EEE7' : 'none', width: '100%', height: "2.5rem"}}>
            <Typography variant={"button"}>
                {props.label}
            </Typography>
            {props.selected && <ArrowForwardIosRoundedIcon sx={{fontSize: 16}}/>}
        </Stack>
    </ButtonBase>
}

export default DataView;