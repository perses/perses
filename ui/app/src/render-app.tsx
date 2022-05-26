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

import { CssBaseline } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ChartsThemeProvider } from '@perses-dev/components';
import App from './App';
import { SnackbarProvider } from './context/SnackbarProvider';
import { DarkModeContextProvider } from './context/DarkMode';

/**
 * Renders the Perses application in the target container.
 */
export function renderApp(container: ReactDOM.Container | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

  ReactDOM.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <DarkModeContextProvider>
          <ChartsThemeProvider themeName="perses">
            <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
              <CssBaseline />
              <App />
            </SnackbarProvider>
          </ChartsThemeProvider>
        </DarkModeContextProvider>
      </QueryClientProvider>
    </React.StrictMode>,
    container
  );
}
