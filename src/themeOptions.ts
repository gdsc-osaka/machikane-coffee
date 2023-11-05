import {ThemeOptions} from "@mui/material";

export const themeOptions: ThemeOptions = {
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 900,
            lg: 1200,
            xl: 1536,
        },
    },
    palette: {
        primary: {
            main: '#8c6938',
        },
        background: {
            default: '#FFFBFF',
            paper: '#FFF8F5'
        }
    },
    typography: {
        fontFamily: 'Noto Sans JP',
        h4: {
            fontSize: "1.8rem",
        },
        caption: {
            color: "#837468"
        },
        button: {
            textTransform: 'none',
        }
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
                },
                contained: {
                    fontWeight: 'normal'
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    backgroundColor: "#EBE0D9",
                },
                colorPrimary: {
                    backgroundColor: "#FFDCBE",
                    color: "#000"
                }
            }
        },
        MuiCard: {
            defaultProps: {
                raised: false
            },
            styleOverrides: {
                root: {
                    borderRadius: 10,
                    // boxShadow: "none"
                }
            }
        }
    }
}