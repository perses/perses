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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { PluginRegistry } from '../components';
import { DefaultPluginKinds } from '../model';
import { testPluginLoader } from './test-plugins';

export type ContextOptions = {
  defaultPluginKinds?: DefaultPluginKinds;
};

export function getTestContextWrapper(contextOptions?: ContextOptions) {
  // Create a new QueryClient for each test to avoid caching issues
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }): ReactNode {
    return (
      <QueryClientProvider client={queryClient}>
        <PluginRegistry
          pluginLoader={testPluginLoader}
          defaultPluginKinds={
            contextOptions?.defaultPluginKinds ?? {
              TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
            }
          }
        >
          {children}
        </PluginRegistry>
      </QueryClientProvider>
    );
  };
}
