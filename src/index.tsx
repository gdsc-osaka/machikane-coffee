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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Header/>
    <BrowserRouter>
    <div>
      <Routes>
        <Route path="/admin" Component={Admin} />
        <Route path="/user" Component={User} />
        <Route path="/timer" Component={Timer} />
      </Routes>
    </div>
    </BrowserRouter>
    <Footer/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
