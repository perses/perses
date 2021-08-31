import { ThemeProvider, CssBaseline } from '@material-ui/core';
import React from 'react';
import ReactDOM from 'react-dom';
import { enableMapSet } from 'immer';
import App from './App';
import { createTheme } from './styles/theme';

function renderApp() {
  ReactDOM.render(
    <React.StrictMode>
      <ThemeProvider theme={createTheme()}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
  );
}

enableMapSet();
renderApp();
