import React, {ReactNode, useContext, useEffect, useState} from "react";
import {auth} from "./modules/firebase/firebase";
import {useLocation, useNavigate, useParams} from "react-router-dom";

const AuthContext = React.createContext<AuthState>({loading: true, role: "unknown"});

type Role = "user" | "admin" | "unknown";

type AuthState = {
    loading: boolean,
    role: Role
}

export const AuthProvider = (props: {children?: ReactNode}) => {
    const [authState, setAuthState] = useState<AuthState>({loading: true, role: "unknown"});

    const navigate = useNavigate();
    const {pathname} = useLocation();
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
                role = "unknown";
            }
            
            // ログインしていない場合、userに遷移する
            setAuthState({
                loading: false,
                role: role
            });

            if (role === "admin" && pathname === "/") {
                navigate("/admin");
            }
        });
    }, [shopId])

    return <AuthContext.Provider value={authState}>
        {props.children}
    </AuthContext.Provider>
}

const AuthGuard = (props: {
    role: Role,
    children: ReactNode
}) => {
    const {role, children} = props;

    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.loading && auth.role !== role) {
            // ルートにリダイレクト
            navigate('/');
        }
    }, [role, auth, navigate]);

    return <>
        {children}
    </>
}

export const useAuth = () => {
    return useContext(AuthContext);
}

export default AuthGuard;