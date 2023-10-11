import store from "./modules/redux/store";
import Header from "./components/Header/Header";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminCashierPage from "./pages/AdminCashierPage";
import User from "./pages/User";
import Timer from "./pages/Timer";
import { TestPage } from "./pages/Test";
import Footer from "./components/Footer/Footer";
import { Provider } from "react-redux";
import React from "react";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { themeOptions } from "./themeOptions";
import AdminBaristaPage from "./pages/AdminBaristaPage";
import LogInPage from "./pages/LogInPage";
import AuthGuard from "./AuthGuard";
import RootPage from "./pages/RootPage";
import AdminPage from "./pages/AdminPage";

const App = () => {
    const theme = createTheme(themeOptions);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>

                <BrowserRouter>
                    <Header/>
                    <Routes>
                        <Route path="/" Component={RootPage}/>
                        <Route path="/:shopId/admin" element={<AuthGuard><AdminPage/></AuthGuard>}/>
                        <Route path="/:shopId/admin/cashier" element={<AuthGuard><AdminCashierPage/></AuthGuard>}/>
                        <Route path="/:shopId/admin/barista" element={<AuthGuard><AdminBaristaPage/></AuthGuard>}/>
                        <Route path="/:shopId/user" Component={User}/>
                        <Route path="/:shopId/timer" Component={Timer}/>
                        <Route path="/:shopId/test" Component={TestPage}/>
                        <Route path="/:shopId/login" Component={LogInPage}/>
                    </Routes>
                </BrowserRouter>
                <Footer/>
            </ThemeProvider>
        </Provider>
    );
};

export default App;
