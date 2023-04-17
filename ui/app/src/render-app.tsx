// Copyright 2023 The Perses Authors
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

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from './context/SnackbarProvider';
import { DarkModeContextProvider } from './context/DarkMode';
import App from './App';
import { NavHistoryProvider } from './context/DashboardNavHistory';

/**
 * Renders the Perses application in the target container.
 */
export function renderApp(container: Element | null) {
  if (container === null) {
    return;
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // react-query uses a default of 3 retries.
        // This sets the default to 0 retries.
        // If needed, the number of retries can be overridden in individual useQuery calls.
        retry: 0,
      },
    },
  });

  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <QueryParamProvider adapter={ReactRouter6Adapter}>
            <DarkModeContextProvider>
              <NavHistoryProvider>
                <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                  <App />
                </SnackbarProvider>
              </NavHistoryProvider>
            </DarkModeContextProvider>
          </QueryParamProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
