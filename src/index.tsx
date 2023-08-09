// region Extension Methods
/// <reference path="modules/extensions/global.d.ts" />
import './modules/extensions/array.extensions';
import './modules/extensions/date.extentions';
// endregion

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Admin from './pages/Admin';
import User from './pages/User';
import Timer from './pages/Timer';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import {Provider} from "react-redux";
import store from "./modules/redux/store";
import {TestPage} from "./pages/Test";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
      <Provider store={store}>
          <Header/>
          <BrowserRouter>
              <div>
                  <Routes>
                      <Route path="/admin" Component={Admin} />
                      <Route path="/user" Component={User} />
                      <Route path="/timer" Component={Timer} />
                      <Route path="/test/:shopId" Component={TestPage} />
                  </Routes>
              </div>
          </BrowserRouter>
          <Footer/>
      </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
