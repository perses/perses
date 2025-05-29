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
