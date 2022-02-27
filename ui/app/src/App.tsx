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

import { DashboardResource } from '@perses-dev/core';
import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import { ErrorAlert } from '@perses-dev/components';
import { PluginRegistry, PluginBoundary } from '@perses-dev/plugin-system';
import ViewDashboard from './views/dashboard/ViewDashboard';
import { DataSourceRegistry } from './context/DataSourceRegistry';
import { useSampleData } from './utils/temp-sample-data';
import Header from './components/Header';
import { useBundledPlugins } from './model/bundled-plugins';

const appStyle: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
};

function App() {
  const dashboard = useSampleData<DashboardResource>(
    new URLSearchParams(window.location.search).get('dashboard') || 'node-exporter-full'
  );
  const { getInstalledPlugins, importPluginModule } = useBundledPlugins();

  if (dashboard === undefined) {
    return null;
  }

  return (
    <Box sx={appStyle}>
      <Header />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        <PluginRegistry getInstalledPlugins={getInstalledPlugins} importPluginModule={importPluginModule}>
          <PluginBoundary loadingFallback="Loading..." ErrorFallbackComponent={ErrorAlert}>
            <DataSourceRegistry>
              <ViewDashboard dashboardResource={dashboard} />
            </DataSourceRegistry>
          </PluginBoundary>
        </PluginRegistry>
      </Box>
    </Box>
  );
}

export default App;
