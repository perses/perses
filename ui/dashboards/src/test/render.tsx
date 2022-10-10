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
import { createMemoryHistory } from 'history';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Test helper to render a React component with some common app-level providers wrapped around it.
 */
export function renderWithContext(ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>) {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);
}

/**
 * Similar to renderWithContext test helper but with routing to test
 * see: https://github.com/pbeshai/use-query-params/blob/master/packages/use-query-params-adapter-react-router-6/src/__tests__/react-router-6.test.tsx
 */
export function renderWithHistory(ui: React.ReactElement, options?: Omit<RenderOptions, 'queries'>) {
  // use this router so we can pass our own history to inspect
  const HistoryRouter = unstable_HistoryRouter;
  const history = createMemoryHistory({ initialEntries: ['/'] });

  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } });

  return render(
    <HistoryRouter history={history}>
      <QueryClientProvider client={queryClient}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>{ui}</QueryParamProvider>
      </QueryClientProvider>
    </HistoryRouter>,
    options
  );
}
