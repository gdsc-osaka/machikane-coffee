import React, {useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {
    Button,
    ButtonBase,
    Dialog,
    DialogActions,
    DialogTitle,
    IconButton,
    Stack,
    useMediaQuery,
    useTheme
} from "@mui/material";
import {useAuth} from "../AuthGuard";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {auth} from "../modules/firebase/firebase";
import toast from "react-hot-toast";
import {signOut} from "firebase/auth";
import CurrencyYenRoundedIcon from '@mui/icons-material/CurrencyYenRounded';
import CoffeeRoundedIcon from '@mui/icons-material/CoffeeRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';

const Header = () => {
    const [open, setOpen] = useState(false);

    const {pathname} = useLocation()
    const navigate = useNavigate();
    const authState = useAuth();
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


    const paths = pathname.split('/');
    const shopId = paths[1];

    let titleText = "コーヒー愛好会";
    // const routerPath = useLocation().pathname;
    //
    //
    // switch(routerPath) {
    //   case "/"+shopId+"/admin/cashier":
    //     titleText = 'レジ';
    //     break;
    //
    //   case "/"+shopId+"/admin-barista":
    //     titleText = 'ドリップ';
    //     break;
    //
    //   default:
    //     titleText = 'コーヒー愛好会';
    //     break;
    // }

    const imageStyle = {
        width: '45px',
        height: '30px',
    };
    const fontStyle = {
        // textAlign: 'center',
        fontFamily: 'Noto Sans JP',
        fontSize: '18px',
        fontStyle: 'normal',
        fontWeight: '600',
        lineHeight: 'normal',
        letterSpacing: '0.1px',
    };

    const handleLogoClick = () => {
        navigate("/");
    }

    const handleSignOut = () => {
        setOpen(false);
        signOut(auth)
            .then(() => {
                toast('ログアウトしました')
            })
            .catch((e) => {
                toast.error(`ログアウトに失敗しました: ${e}`)
            });
    }

    const naviAdminPage = () => {
        navigate(`/admin`)
    }

    const naviAdminCashierPage = () => {
        navigate(`/${shopId}/admin`);
    }

    const naviBaristaPage = () => {
        navigate(`/${shopId}/admin/barista`)
    }

    const handleClose = () => {
        setOpen(false);
    }

    return (
        <Stack padding={"15px"} direction={"row"} justifyContent={'space-between'} alignItems={"center"}
               sx={{borderBottom: 'solid #837468 1px'}}>
            <ButtonBase onClick={handleLogoClick} sx={{borderRadius: "10px"}}>
                <Stack direction={"row"} spacing={1} padding={"5px"}>
                    <img style={imageStyle} src="/images/logo.png" alt={"logo"}/>
                    <div style={fontStyle}>{titleText}</div>
                </Stack>
            </ButtonBase>
            <Stack direction={"row"} spacing={0}>
                {authState.role === 'admin' && shopId !== '' && !["admin", "login"].includes(shopId) &&
                    <React.Fragment>
                        {isMobile ?
                            <IconButton onClick={naviAdminCashierPage}>
                                <CurrencyYenRoundedIcon sx={{color: theme.palette.primary.main}}/>
                            </IconButton>
                            :
                            <Button variant="text" onClick={naviAdminCashierPage}>レジ</Button>
                        }
                        {isMobile ?
                            <IconButton onClick={naviBaristaPage}>
                                <CoffeeRoundedIcon sx={{color: theme.palette.primary.main}}/>
                            </IconButton>
                            :
                            <Button variant="text" onClick={naviBaristaPage}>ドリップ</Button>
                        }
                    </React.Fragment>
                }
                {authState.role === 'admin' &&
                    (isMobile ?
                            <IconButton onClick={naviAdminPage}>
                                <StorageRoundedIcon sx={{color: theme.palette.primary.main}}/>
                            </IconButton>
                            :
                            <Button variant="text" onClick={naviAdminPage}>管理</Button>)
                }
                {authState.role !== 'unknown' &&
                    <IconButton onClick={() => setOpen(true)}>
                        <LogoutRoundedIcon sx={{color: theme.palette.primary.main}}/>
                    </IconButton>
                }
            </Stack>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>
                    ログアウトしますか？
                </DialogTitle>
                <DialogActions>
                    <Button onClick={handleClose}>
                        キャンセル
                    </Button>
                    <Button onClick={handleSignOut}>
                        ログアウト
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default Header;
  