import React from "react";
import Container from "@mui/material/Container";
import {IconButton, Link, Stack, Typography} from "@mui/material";
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';

const Footer = () => {
    const openUrl = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer')
    }

    return <footer>
        <Container sx={{backgroundColor: '#FFF8F5', padding: '1.5rem', marginTop: 'auto'}}>
            <Stack spacing={1}>
                <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography variant={"h6"}>
                        コーヒー愛好会
                    </Typography>
                    <Stack direction={"row"}>
                        <IconButton onClick={() => openUrl("https://www.instagram.com/coffee_handai/")}>
                            <InstagramIcon/>
                        </IconButton>
                        <IconButton onClick={() => openUrl("https://twitter.com/coffee_handai")}>
                            <TwitterIcon/>
                        </IconButton>
                    </Stack>
                </Stack>
                <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography variant={"body1"}>
                        Email
                    </Typography>
                    <Link href={"mailto:coffee.handai2021@gmail.com"} underline="hover">
                        <Typography variant={"body1"}>
                            coffee.handai2021@gmail.com
                        </Typography>
                    </Link>
                </Stack>
                <Stack direction={"row"} justifyContent={"space-between"}>
                    <Typography variant={"body1"}>
                        Web
                    </Typography>
                    <Link href={"https://handaicoffee.base.shop/"} underline="hover" target="_blank">
                        <Typography variant={"body1"}>
                            https://handaicoffee.base.shop/
                        </Typography>
                    </Link>
                </Stack>
            </Stack>
        </Container>
    </footer>
  };
  
  export default Footer;
  