import store from "./modules/redux/store";
import Header from "./components/Header/Header";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import User from "./pages/User";
import Timer from "./pages/Timer";
import {TestPage} from "./pages/Test";
import Footer from "./components/Footer/Footer";
import {Provider} from "react-redux";
import React from "react";
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import {themeOptions} from "./themeOptions";
import AdminBaristaPage from "./pages/AdminBaristaPage";

const App = () => {
    const theme = createTheme(themeOptions);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Header/>
                <BrowserRouter>
                    <Routes>
                        <Route path="/:shopId/admin" Component={AdminPage} />
                        <Route path="/:shopId/admin-barista" Component={AdminBaristaPage} />
                        <Route path="/:shopId/user" Component={User} />
                        <Route path="/:shopId/timer" Component={Timer} />
                        <Route path="/:shopId/test" Component={TestPage} />
                    </Routes>
                </BrowserRouter>
                <Footer/>
            </ThemeProvider>
        </Provider>
    );
}

export default App;