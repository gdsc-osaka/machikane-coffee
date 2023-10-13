import React from "react";
import {matchPath, useLocation, useNavigate} from "react-router-dom";
import {Button, ButtonBase} from "@mui/material";
import {useAuth} from "../../AuthGuard";

const Header = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate();
  const auth = useAuth();

  const match =  matchPath({path: "/:shopId"}, pathname)
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
  const headerStyle = {
    display: 'flex',
    // width: 412px;
    // height: 60px;
    padding: '15px 20px',
    // flexDirection: 'column' as 'column',
    // justifyContent: 'center',
    alignIitems: 'center',
    // alignIitems: 'flex-start',
    gap: '10px',
    borderBottom: 'solid #837468 1px',
    justifyContent: 'space-between'
  }
  const logoStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    marginRight: 'auto',
    padding: '0px 10px',
  }

  const buttonsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }


  const handleLogoClick = () => {
    navigate("/");
  }

    return (
      <div style={headerStyle}>
        <ButtonBase onClick={handleLogoClick} sx={{borderRadius: "10px"}}>
          <div style={logoStyle}>
            <img style={imageStyle} src="/images/logo.png"  alt={"logo"}/>
            <div style={fontStyle}>{titleText}</div>
          </div>
        </ButtonBase>
        <div style={buttonsStyle}>
        {auth.role === "admin" && shopId === undefined &&
            <Button variant="text" onClick={() => navigate(`/admin`)}>管理</Button>
        }
        {auth.role === "admin" && shopId !== undefined && !["admin", "login"].includes(shopId) &&
              <React.Fragment>
                <Button variant="text" onClick={() => navigate(`/${shopId}/admin`)}>レジ</Button>
                <Button variant="text" onClick={() => navigate(`/${shopId}/admin/barista`)}>ドリップ係</Button>
              </React.Fragment>
        }
      </div>
      </div>
    );
  };
  
  export default Header;
  