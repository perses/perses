# Embedding Perses panels

This little documentation aims to provide you the minimum code needed to have a Perses panel into your React
application.

!!! info
    We are working actively on reducing this amount of required dependencies/providers working on some default values or opt-in/opt-out mechanisms.

## Getting started (npm example)

```bash
# Create new React app or modify an existing app using the dependencies below
# Example: https://react.dev/learn/build-a-react-app-from-scratch

# Install Perses dependencies
# Note: React 19 is not supported yet
npm i --save @perses-dev/components \
  @perses-dev/plugin-system @perses-dev/timeseries-chart-plugin \
  @perses-dev/prometheus-plugin @perses-dev/dashboards \
  @tanstack/react-query \
  @mui/material \
  @emotion/styled @hookform/resolvers \
  react@18 react-dom@18
```

## Minimal code

Here replacing your App.tsx

```typescript
import React from "react";
import "./App.css";

import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
  SnackbarProvider,
} from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
} from "@perses-dev/plugin-system";
import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DatasourceStoreProvider,
  Panel,
  VariableProvider,
} from "@perses-dev/dashboards";
import {
  DashboardResource,
  GlobalDatasourceResource,
  DatasourceResource,
} from "@perses-dev/core";
import { DatasourceApi } from "@perses-dev/dashboards";
import * as prometheusPlugin from "@perses-dev/prometheus-plugin";
import * as timeseriesChartPlugin from "@perses-dev/timeseries-chart-plugin";

const fakeDatasource: GlobalDatasourceResource = {
  kind: "GlobalDatasource",
  metadata: { name: "hello" },
  spec: {
    default: true,
    plugin: {
      kind: "PrometheusDatasource",
      spec: {
        // Update to your actual datasource url
        directUrl: "https://prometheus.demo.do.prometheus.io",
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
    return "/prometheus";
  }
}
export const fakeDatasourceApi = new DatasourceApiImpl();
export const fakeDashboard = {
  kind: "Dashboard",
  metadata: {},
  spec: {},
} as DashboardResource;

function App() {
  const muiTheme = getTheme("light");
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
        <SnackbarProvider
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="default"
          content=""
        >
          <PluginRegistry
            pluginLoader={pluginLoader}
            defaultPluginKinds={{
              Panel: "TimeSeriesChart",
              TimeSeriesQuery: "PrometheusTimeSeriesQuery",
            }}
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider
                refreshInterval="0s"
                timeRange={{ pastDuration: "30m" }}
              >
                <VariableProvider>
                  <DatasourceStoreProvider
                    dashboardResource={fakeDashboard}
                    datasourceApi={fakeDatasourceApi}
                  >
                    <DataQueriesProvider
                      definitions={[
                        {
                          kind: "PrometheusTimeSeriesQuery",
                          spec: { query: `up{job="prometheus"}` },
                        },
                      ]}
                    >
                      <Panel
                        panelOptions={{
                          hideHeader: true,
                        }}
                        definition={{
                          kind: "Panel",
                          spec: {
                            display: { name: "Example Panel" },
                            plugin: {
                              kind: "TimeSeriesChart",
                              spec: {
                                legend: {
                                  position: "bottom",
                                  size: "medium",
                                },
                              },
                            },
                          },
                        }}
                      />
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
```

You should now see a Perses panel in your app's UI:

![embedded_panel](./images/embedded-panel-screenshot.png)

## Definitions by provider

> Check each Provider's source code/jsdoc for more details.

- `DataQueriesProvider`: Provide the queries' definition, with the query type, the value. This is to be inside the
  chart below. For each query, one line will be displayed in the chart.
- `DatasourceStoreProvider`: Provide the datasources. In other terms, the place from which the data will be collected.
- `VariableProvider`: Provide the variables that can be used inside the chart.
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
