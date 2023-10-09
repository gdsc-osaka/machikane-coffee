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
        fontFamily: 'Noto Sans JP',
        h1: {
            fontWeight: "bold",
        },
        h2: {
            fontWeight: "bold",
        },
        h3: {
            fontWeight: "bold",
        },
        h4: {
            fontSize: "1.8rem",
            fontWeight: "bold",
        },
        h5: {
            fontWeight: "bold",
        },
        h6: {
            fontWeight: "bold",
        },
        caption: {
            color: "#837468"
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