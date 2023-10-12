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
import AuthGuard from "./AuthGuard";
import RootPage from "./pages/RootPage";
import AdminPage from "./pages/AdminPage";

const App = () => {
    const theme = createTheme(themeOptions);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <div style={{display: 'flex', minHeight: '100vh', flexDirection: "column"}}>
                    <Header/>
                    <main style={{flexGrow: 1}}>
                        <BrowserRouter>
                            <Routes>
                                <Route path="/" Component={RootPage}/>
                                <Route path="/:shopId/" Component={OrderPage}/>
                                <Route path="/:shopId/:orderIndex" Component={OrderPage}/>
                                <Route path="/:shopId/timer" Component={Timer}/>
                                <Route path="/login" Component={LogInPage}/>
                                <Route path="/admin" element={<AuthGuard><AdminPage/></AuthGuard>}/>
                                <Route path="/:shopId/admin/cashier" element={<AuthGuard><AdminCashierPage/></AuthGuard>}/>
                                <Route path="/:shopId/admin/barista" element={<AuthGuard><AdminBaristaPage/></AuthGuard>}/>
                            </Routes>
                        </BrowserRouter>
                    </main>
                    <Footer/>
                </div>
            </ThemeProvider>
        </Provider>
    );
};

export default App;
