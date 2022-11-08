// Copyright 2022 The Perses Authors
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

import { render, RenderOptions } from '@testing-library/react';
import { unstable_HistoryRouter } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartsThemeProvider, testChartsTheme } from '@perses-dev/components';
import { mockPluginRegistry, PluginRegistry } from '@perses-dev/plugin-system';
import { MOCK_PLUGINS } from './plugin-registry';

/**
 * Test helper to render a React component with some common app-level providers wrapped around it.
 */
export function renderWithContext(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
  history?: MemoryHistory
) {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

  const BaseRender = () => {
    const HistoryRouter = unstable_HistoryRouter;
    history = history ?? createMemoryHistory();
    return (
      <HistoryRouter history={history}>
        <QueryClientProvider client={queryClient}>
          <QueryParamProvider adapter={ReactRouter6Adapter}>
            <ChartsThemeProvider chartsTheme={testChartsTheme}>
              <PluginRegistry {...mockPluginRegistry(...MOCK_PLUGINS)}>{ui}</PluginRegistry>
            </ChartsThemeProvider>
          </QueryParamProvider>
        </QueryClientProvider>
      </HistoryRouter>
    );
  };

  return render(<BaseRender />, options);
}
