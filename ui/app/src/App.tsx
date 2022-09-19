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

import { useMemo } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { Box, useTheme } from '@mui/material';
import { ErrorAlert, ChartsThemeProvider, generateChartsTheme, PersesChartsTheme } from '@perses-dev/components';
import { QueryStringProvider } from '@perses-dev/dashboards';
import { PluginRegistry, PluginBoundary } from '@perses-dev/plugin-system';
import ViewDashboard from './views/ViewDashboard';
import Docs from './views/Docs';
import { DataSourceRegistry } from './context/DataSourceRegistry';
import Header from './components/Header';
import Footer from './components/Footer';
import { useBundledPlugins } from './model/bundled-plugins';

// app specific echarts option overrides, empty since perses uses default
// https://apache.github.io/echarts-handbook/en/concepts/style/#theme
const ECHARTS_THEME_OVERRIDES = {};

function App() {
  const { getInstalledPlugins, importPluginModule } = useBundledPlugins();

  const [searchParams, setSearchParams] = useSearchParams();

  const muiTheme = useTheme();
  const chartsTheme: PersesChartsTheme = useMemo(() => {
    return generateChartsTheme('perses', muiTheme, ECHARTS_THEME_OVERRIDES);
  }, [muiTheme]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Routes>
        <Route path="docs" element={<Docs />} />
      </Routes>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <ChartsThemeProvider themeName="perses" chartsTheme={chartsTheme}>
          <PluginRegistry getInstalledPlugins={getInstalledPlugins} importPluginModule={importPluginModule}>
            <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
              <DataSourceRegistry>
                <QueryStringProvider queryParams={searchParams} setQueryParams={setSearchParams}>
                  <ViewDashboard />
                </QueryStringProvider>
              </DataSourceRegistry>
            </PluginBoundary>
          </PluginRegistry>
        </ChartsThemeProvider>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
