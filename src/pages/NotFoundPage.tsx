import {Card, Link as MLink, Stack, Typography} from "@mui/material";
import {Link} from "react-router-dom";

const NotFoundPage = () => {
    return <Card sx={{margin: "2rem", marginTop: "5rem"}}>
        <Stack alignItems={"center"} justifyContent={"center"} spacing={2} padding={"5rem"}>
            <Typography variant={"h4"} fontWeight={"bold"}>
                404 Not Found
            </Typography>
            <Typography variant={"body1"}>
                ページが見つかりませんでした
            </Typography>
            <MLink>
              <Link to={"/"}>
                  トップに戻る
              </Link>
            </MLink>
        </Stack>
    </Card>
}

export default NotFoundPage;