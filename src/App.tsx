import store from "./modules/redux/store";
import Header from "./components/Header/Header";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import AdminCashierPage from "./pages/AdminCashierPage";
import Timer from "./pages/Timer";
import Footer from "./components/Footer/Footer";
import {Provider} from "react-redux";
import React from "react";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {themeOptions} from "./themeOptions";
import AdminBaristaPage from "./pages/AdminBaristaPage";
import LogInPage from "./pages/LogInPage";
import OrderPage from "./pages/OrderPage";
import AuthGuard, {AuthProvider} from "./AuthGuard";
import RootPage from "./pages/RootPage";
import AdminPage from "./pages/AdminPage";
import NotFoundPage from "./pages/NotFoundPage";
// @ts-ignore
import {Toaster} from "react-hot-toast";

const App = () => {
    const theme = createTheme(themeOptions);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div style={{display: 'flex', minHeight: '100vh', flexDirection: "column"}}>
                    <BrowserRouter>
                        <AuthProvider>
                            <Header/>
                            <Toaster/>
                            <main style={{flexGrow: 1}}>
                                <Routes>
                                    <Route path={"/"} Component={RootPage}/>
                                    <Route path={"/login"} Component={LogInPage}/>
                                    <Route path={"/admin"} element={
                                        <AuthGuard role={"admin"}>
                                            <AdminPage/>
                                        </AuthGuard>
                                    }/>
                                    <Route path={"/:shopId"}>
                                        <Route path={""} Component={OrderPage}/>
                                        <Route path={"timer"} Component={Timer}/>
                                        <Route path={"admin"}>
                                            <Route path={""} element={
                                                <AuthGuard role={"admin"}>
                                                    <AdminCashierPage/>
                                                </AuthGuard>}/>
                                            <Route path={"barista"} element={
                                                <AuthGuard role={"admin"}>
                                                    <AdminBaristaPage/>
                                                </AuthGuard>}/>
                                        </Route>
                                    </Route>
                                    <Route path={"*"} Component={NotFoundPage}/>
                                </Routes>
                            </main>
                            <Footer/>
                        </AuthProvider>
                    </BrowserRouter>
                </div>
            </ThemeProvider>
        </Provider>
    );
};

export default App;
