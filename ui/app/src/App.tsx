// Copyright 2021 The Perses Authors
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

import { Box, useTheme } from '@mui/material';
import { generateChartsTheme, ChartsThemeProvider, ErrorAlert } from '@perses-dev/components';
import { PluginRegistry, PluginBoundary } from '@perses-dev/plugin-system';
import ViewDashboard from './views/ViewDashboard';
import { DataSourceRegistry } from './context/DataSourceRegistry';
import Header from './components/Header';
import { useBundledPlugins } from './model/bundled-plugins';

function App() {
  const { getInstalledPlugins, importPluginModule } = useBundledPlugins();

  const muiTheme = useTheme();
  const echartsTheme = {}; // echarts theme overrides go here
  const persesChartsTheme = {
    themeName: 'perses',
    theme: generateChartsTheme(echartsTheme, muiTheme),
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <Header />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <ChartsThemeProvider chartsTheme={persesChartsTheme}>
          <PluginRegistry getInstalledPlugins={getInstalledPlugins} importPluginModule={importPluginModule}>
            <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
              <DataSourceRegistry>
                <ViewDashboard />
              </DataSourceRegistry>
            </PluginBoundary>
          </PluginRegistry>
        </ChartsThemeProvider>
      </Box>
    </Box>
  );
}

export default App;
