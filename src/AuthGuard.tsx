import React, {ReactNode, useContext, useEffect, useState} from "react";
import {auth} from "./modules/firebase/firebase";
import {Route, useNavigate, useParams} from "react-router-dom";

export const AuthContext = React.createContext<AuthState>({loading: true, role: "unknown"});

type Role = "user" | "admin" | "unknown";

type AuthState = {
    loading: boolean,
    role: Role
}

const AuthGuard = (props: {children?: ReactNode}) => {
    const [authState, setAuthState] = useState<AuthState>({loading: true, role: "unknown"});

    const navigate = useNavigate();
    const params = useParams();
    const shopId = params.shopId;
    
    useEffect(() => {
        auth.onAuthStateChanged(async (user) => {
            let role: Role;
            
            if (user) {
                role = await user.getIdTokenResult(true).then((result) => {
                    if (result.claims.admin === true) {
                        return "admin";
                    } else {
                        return "user";
                    }
                });
            } else {
                role = "user";
            }
            
            // ログインしていない場合、userに遷移する
            setAuthState({
                loading: false,
                role: role
            });

            if (role !== "admin") {
                // TODO: 同一階層での遷移 '../' が機能しない. もっと綺麗な書き方に変える(shopIdに依存しない)
                navigate(`/${shopId}/user`);
            }
        });
    }, [navigate, shopId])

    return <AuthContext.Provider value={authState}>
        {props.children}
    </AuthContext.Provider>
}

export const useAuth = () => {
    return useContext(AuthContext);
}

export default AuthGuard;