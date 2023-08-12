// region Extension Methods
/// <reference path="modules/extensions/global.d.ts" />
import './modules/extensions/array.extensions';
import './modules/extensions/date.extentions';
// endregion

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
      <App/>
  </React.StrictMode>
);

reportWebVitals();
