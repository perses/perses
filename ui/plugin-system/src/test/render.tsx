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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PluginRegistry } from '../components/PluginRegistry';
import { testRegistryProps } from './test-plugins';

const testLogger = {
  log: console.log,
  warn: console.warn,
  error: () => {
    // Don't log network errors in tests to the console
  },
};

/**
 * Test helper to render a React component with some common app-level providers, as well as the PluginRegistry
 * wrapped around it.
 */
export function renderWithContext(ui: React.ReactNode, options?: Omit<RenderOptions, 'queries'>) {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
    logger: testLogger,
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PluginRegistry {...testRegistryProps}>{ui}</PluginRegistry>
    </QueryClientProvider>,
    options
  );
}
