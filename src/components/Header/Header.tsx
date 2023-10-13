import React from "react";
import {matchPath, useLocation, useNavigate} from "react-router-dom";
import {Button, ButtonBase, IconButton, Stack, useTheme} from "@mui/material";
import {useAuth} from "../../AuthGuard";
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {auth} from "../../modules/firebase/firebase";
import toast from "react-hot-toast";
import {signOut} from "firebase/auth";

const Header = () => {
    const {pathname} = useLocation()
    const navigate = useNavigate();
    const authState = useAuth();
    const theme = useTheme()

    const match = matchPath({path: "/:shopId"}, pathname)
    const shopId = match?.params.shopId;

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
        signOut(auth)
            .then(() => {
                toast('ログアウトしました')
            })
            .catch((e) => {
                toast.error(`ログアウトに失敗しました: ${e}`)
            });
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
            <Stack direction={"row"} spacing={0.5}>
                {authState.role === 'admin' &&shopId === undefined &&
                    <Button variant="text" onClick={() => navigate(`/admin`)}>管理</Button>
                }
                {authState.role === 'admin' &&shopId !== undefined && !["admin", "login"].includes(shopId) &&
                    <React.Fragment>
                        <Button variant="text" onClick={() => navigate(`/${shopId}/admin`)}>レジ</Button>
                        <Button variant="text" onClick={() => navigate(`/${shopId}/admin/barista`)}>ドリップ係</Button>
                    </React.Fragment>
                }
                {authState.role !== 'unknown' &&
                    <IconButton onClick={handleSignOut}>
                        <LogoutRoundedIcon sx={{color: theme.palette.primary.main}}/>
                    </IconButton>
                }
            </Stack>
        </Stack>
    );
};

export default Header;
  