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
import {createTheme, ThemeProvider} from "@mui/material";
import {themeOptions} from "./themeOptions";

const App = () => {
    const theme = createTheme(themeOptions);

    return (
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <Header/>
                <BrowserRouter>
                    <div>
                        <Routes>
                            <Route path="/:shopId/admin" Component={AdminPage} />
                            <Route path="/:shopId/user" Component={User} />
                            <Route path="/:shopId/timer" Component={Timer} />
                            <Route path="/:shopId/test" Component={TestPage} />
                        </Routes>
                    </div>
                </BrowserRouter>
                <Footer/>
            </ThemeProvider>
        </Provider>
    );
}

export default App;