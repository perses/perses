// Copyright 2025 The Perses Authors
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

import { ChartsProvider, generateChartsTheme, getTheme, SnackbarProvider } from '@perses-dev/components';
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  PluginRegistry,
  TimeRangeProvider,
} from '@perses-dev/plugin-system';
import { Box, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DatasourceStoreProvider, Panel, VariableProvider, DatasourceApi } from '@perses-dev/dashboards';
import { DashboardResource, GlobalDatasourceResource, DatasourceResource } from '@perses-dev/core';
import * as prometheusPlugin from '@perses-dev/prometheus-plugin';
import * as timeseriesChartPlugin from '@perses-dev/timeseries-chart-plugin';

const fakeDatasource: GlobalDatasourceResource = {
  kind: 'GlobalDatasource',
  metadata: { name: 'hello' },
  spec: {
    default: true,
    plugin: {
      kind: 'PrometheusDatasource',
      spec: {
        // Update to your actual datasource url
        directUrl: 'https://prometheus.demo.do.prometheus.io',
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<DatasourceResource | undefined> {
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(): Promise<GlobalDatasourceResource | undefined> {
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(): Promise<DatasourceResource[]> {
    return Promise.resolve([]);
  }

  listGlobalDatasources(): Promise<GlobalDatasourceResource[]> {
    return Promise.resolve([fakeDatasource]);
  }

  buildProxyUrl(): string {
    return '/prometheus';
  }
}
export const fakeDatasourceApi = new DatasourceApiImpl();
export const fakeDashboard = {
  kind: 'Dashboard',
  metadata: {},
  spec: {},
} as DashboardResource;

function App() {
  const muiTheme = getTheme('light');
  const chartsTheme = generateChartsTheme(muiTheme, {});
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(prometheusPlugin),
    },
    {
      resource: timeseriesChartPlugin.getPluginModule(),
      importPlugin: () => Promise.resolve(timeseriesChartPlugin),
    },
  ]);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  });
  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>
        <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="default" content="">
          <PluginRegistry
            pluginLoader={pluginLoader}
            defaultPluginKinds={{
              Panel: 'TimeSeriesChart',
              TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
            }}
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider refreshInterval="0s" timeRange={{ pastDuration: '30m' }}>
                <VariableProvider>
                  <DatasourceStoreProvider dashboardResource={fakeDashboard} datasourceApi={fakeDatasourceApi}>
                    <DataQueriesProvider
                      definitions={[
                        {
                          kind: 'PrometheusTimeSeriesQuery',
                          spec: { query: `up{job="prometheus"}` },
                        },
                      ]}
                    >
                      <Box sx={{ width: 500, height: 300 }}>
                        <Panel
                          definition={{
                            kind: 'Panel',
                            spec: {
                              display: { name: 'Example Panel' },
                              plugin: {
                                kind: 'TimeSeriesChart',
                                spec: {
                                  legend: {
                                    position: 'bottom',
                                    size: 'medium',
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </Box>
                    </DataQueriesProvider>
                  </DatasourceStoreProvider>
                </VariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </PluginRegistry>
        </SnackbarProvider>
      </ChartsProvider>
    </ThemeProvider>
  );
}

export default App;
