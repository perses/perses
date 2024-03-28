# Embedding Perses panels

This little documentation aims to provide you the minimum code needed to have a Perses panel into your React
application.

> Disclaimer: We are working actively on reducing this amount of required dependencies/providers
> working on some default values or opt-in/opt-out mechanisms.

## Getting started (npm example)

```bash
# For example you can use the create-react-app command line or reuse the code of your app
npx create-react-app perses-embedded-panel --template typescript

# Install perses dependencies
npm i --save @perses-dev/components \
  @perses-dev/plugin-system @perses-dev/panels-plugin \
  @tanstack/react-query @perses-dev/dashboards \
  @mui/material @perses-dev/prometheus-plugin \
  @emotion/styled @hookform/resolvers
```

## Minimal code

Here replacing your App.tsx

```tsx
import React from 'react';
import './App.css';

import { ChartsProvider, generateChartsTheme, getTheme, SnackbarProvider } from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader, PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider
} from "@perses-dev/plugin-system";
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DatasourceStoreProvider, TemplateVariableProvider } from "@perses-dev/dashboards";
import prometheusResource from '@perses-dev/prometheus-plugin/plugin.json';
import panelsResource from '@perses-dev/panels-plugin/plugin.json';
import { DashboardResource, GlobalDatasource, ProjectDatasource } from '@perses-dev/core';
import { DatasourceApi } from '@perses-dev/dashboards';


const fakeDatasource: GlobalDatasource = {
  kind: 'GlobalDatasource',
  metadata: { name: 'hello' },
  spec: {
    default: true,
    plugin: {
      kind: 'PrometheusDatasource',
      spec: {
        directUrl: "https://prometheus.demo.do.prometheus.io"
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<ProjectDatasource | undefined> {
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(): Promise<GlobalDatasource | undefined> {
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(): Promise<ProjectDatasource[]> {
    return Promise.resolve([]);
  }

  listGlobalDatasources(): Promise<GlobalDatasource[]> {
    return Promise.resolve([fakeDatasource]);
  }

  buildProxyUrl(): string {
    return '/prometheus';
  }
}
export const fakeDatasourceApi = new DatasourceApiImpl();
export const fakeDashboard = { kind: 'Dashboard', metadata: {}, spec: {} } as DashboardResource;

function App() {
  const muiTheme = getTheme('light');
  const chartsTheme = generateChartsTheme(muiTheme, {});
  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusResource as PluginModuleResource,
      importPlugin: () => import('@perses-dev/prometheus-plugin'),
    },
    {
      resource: panelsResource as PluginModuleResource,
      importPlugin: () => import('@perses-dev/panels-plugin'),
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
                <TemplateVariableProvider>
                  <DatasourceStoreProvider dashboardResource={fakeDashboard} datasourceApi={fakeDatasourceApi}>
                    <DataQueriesProvider
                      definitions={[
                        {
                          kind: 'PrometheusTimeSeriesQuery',
                          spec: { query: `up{job="prometheus"}` },
                        },
                      ]}
                    >
                      <TimeSeriesChart.PanelComponent
                        contentDimensions={{
                          width: 1200,
                          height: 400,
                        }}
                        spec={{
                          legend: {
                            position: 'bottom',
                            size: 'medium',
                          },
                        }}
                      />
                    </DataQueriesProvider>
                  </DatasourceStoreProvider>
                </TemplateVariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </PluginRegistry>
        </SnackbarProvider>
      </ChartsProvider>
    </ThemeProvider>
  );
}


export default App;

```

You should see a perses panel going to your browser

<img src="../images/embedded-panel-screenshot.png">

## Definitions by provider

> Check each Provider's source code/jsdoc for more details.

- `DataQueriesProvider`: Provide the queries' definition, with the query type, the value. This is to be inside the
  chart below. For each query, one line will be displayed in the chart.
- `DatasourceStoreProvider`: Provide the datasources. In other terms, the place from which the data will be collected.
- `TemplateVariableProvider`: Provide the variables that can be used inside the chart.
  It will allow you to reference any variable into the queries thanks to the `${myVar}` syntax.
  Available variables will be either the builtin variables or the local/external variables that you can pass to the provider.
- `TimeRangeProvider`: Provide `time range` of the query, but also the `refresh interval` (time between each query
  automatic replay)
- `QueryClientProvider`: Provide a `@tanstack/react-query` `QueryClient`, which is a mandatory dependency.
  (We advise to configure it with `refetchOnWindowFocus: false` except if you want to replay the queries every time
  you change window)
- `QueryParamProvider`: Provide the ability to take time range, refresh interval, and different variables from the
  url query params.
- `BrowserRouter`: Provide necessary elements for the `QueryParamProvider`
- `PluginRegistry`: Provide the different Perses plugins that will be used in the providers/charts below.
- `SnackbarProvider`: Provide the toaster that will occurs in case of error/success.
- `ChartsProvider`: Provider for the option of [apache/echarts](https://echarts.apache.org/en/option.html) library.
  Which is used for all the charts display.
- `ThemeProvider`: Provider of the [Material UI theme](https://mui.com/material-ui/customization/theming/) which is
  currently the theme used in Perses.
