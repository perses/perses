import React from 'react';
import {render} from 'react-dom';
import App from './App';

const rootEl = document.getElementById('root');
if (rootEl) {
  render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    rootEl
  );
}
