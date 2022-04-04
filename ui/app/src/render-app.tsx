// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './App';
import { createTheme } from './styles/theme';
import { SnackbarProvider } from './context/SnackbarProvider';

/**
 * Renders the Perses application in the target container.
 */
export function renderApp(container: ReactDOM.Container | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

  ReactDOM.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={createTheme()}>
          <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
            <CssBaseline />
            <App />
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>,
    container
  );
}
