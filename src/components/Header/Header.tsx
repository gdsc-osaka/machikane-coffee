import React from "react";
import { Image } from "@mui/icons-material";
// import { useRouter } from 'next/router';

const Header = () => {

  let titleText = "";
  const routerPath = "user";

  switch(routerPath) {
    case "user":
      titleText = 'コーヒー愛好会';
      break;

    // case 'admin':
    //   titleText = '管理ページ';
    //   break;

    // case 'Barista':
    //   titleText = 'ドリップ';
    //   break;

    // case 'Cashier':
    //   titleText = 'レジ';
    //   break;

    // case 'Login':
    //   titleText = 'コーヒー愛好会';
    //   break;

    default:
      titleText = 'コーヒー愛好会';
      break;

  }

  const imageStyle = {
    width: '40px',
    height: '26.4px',
  };
  const fontStyle = {
    // textAlign: 'center',
    fontFamily: 'Roboto',
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
    padding: '0px 20px',
    // flex-direction: column;
    justifyContent: 'center',
    alignIitems: 'flex-start',
    gap: '10px',
  }
  const logoStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
  }

    return (
      <div style={headerStyle}>
        <div style={logoStyle}>
          <img style={imageStyle} src="/images/logo192.png" />
          <div style={fontStyle}>{titleText}</div>
        </div>
      </div>
    );
  };
  
  export default Header;
  