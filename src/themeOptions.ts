import {ThemeOptions} from "@mui/material";

export const themeOptions: ThemeOptions = {
    palette: {
        primary: {
            main: '#8B5000',
        },
        background: {
            default: '#FFFBFF',
            paper: '#FFF8F5'
        }
    },
    typography: {
        fontFamily: "Roboto",
        h4: {
            fontSize: "1.8rem"
        },
    },
    components: {
        MuiDivider: {

        },
        MuiToggleButton: {
            styleOverrides: {
                root: {
                    borderRadius: "5rem",
                    borderColor: "#271900",
                    padding: "0.4rem",
                    "&.Mui-selected": {
                        color: "#271900",
                        backgroundColor: '#FFDEA7',
                        borderWidth: "1px"
                    },
                },
            }
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true
            },
            styleOverrides: {
                root: {
                    borderRadius: 100,
                    paddingTop: 5,
                    paddingBottom: 5,
                },
                outlined: {
                    borderColor: "#837468"
                }
            }
        }
    }
}