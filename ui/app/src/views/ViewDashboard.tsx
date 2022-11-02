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

import { ViewDashboard as DashboardView } from '@perses-dev/dashboards';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { bundledPluginLoader } from '../model/bundled-plugins';
import { useDashboard } from '../model/dashboard-client';
import { useDatasourceApi } from '../model/datasource-api';
import DashboardBreadcrumbs from '../components/DashboardBreadcrumbs';

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard() {
  const { projectName, dashboardName } = useParams();

  if (projectName === undefined || dashboardName === undefined) {
    throw new Error('Unable to get the Dashboard or Project name');
  }

  const datasourceApi = useDatasourceApi();

  const { data, isLoading } = useDashboard(projectName, dashboardName);

  if (isLoading === true) return null;

  if (!data || data.spec === undefined) return null;

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        overflow: 'hidden',
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginRegistry pluginLoader={bundledPluginLoader}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
              <DashboardView
                dashboardResource={data}
                datasourceApi={datasourceApi}
                dashboardTitleComponent={
                  <DashboardBreadcrumbs dashboardName={data.metadata.name} dashboardProject={data.metadata.project} />
                }
              />
          </ErrorBoundary>
        </PluginRegistry>
      </ErrorBoundary>
    </Box>
  );
}

export default ViewDashboard;
