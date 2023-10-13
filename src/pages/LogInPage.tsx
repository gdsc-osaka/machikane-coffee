import * as React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import {signInWithEmailAndPassword} from "firebase/auth";
import {useNavigate} from "react-router-dom";
import {auth} from "../modules/firebase/firebase";
import {useAuth} from "../AuthGuard";
import {useEffect} from "react";
import toast from "react-hot-toast";

export default function LogInPage() {
  const navigate = useNavigate();
  const authState = useAuth();

  useEffect(() => {
    if (authState.role !== "unknown") {
      toast("既にログインしています");
      navigate('/');
    }
  }, [authState, navigate]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const email = (data.get("email") ?? "") as string;
    const password = (data.get("password") ?? "") as string;

    signInWithEmailAndPassword(auth, email, password)
        .then(result => {
          result.user.getIdTokenResult()
              .then(tokenResult => {
                if (tokenResult.claims.admin) {
                  toast("管理者としてログインしました");
                }
              })
        });
  };

  return (
      <Container component="main" maxWidth="xs">
        <Box sx={{marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center",}}>
          <Typography component="h1" variant="h5">
            ログイン
          </Typography>
          <Box
              component="form" onSubmit={handleSubmit}
              noValidate sx={{mt: 1}}>
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                type={"email"}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
            />
            <FormControlLabel
                control={<Checkbox value="remember" color="primary"/>}
                label="Remember me"
            />
            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{mt: 3, mb: 2}}
            >
              ログイン
            </Button>
          </Box>
        </Box>
      </Container>
  );
}
