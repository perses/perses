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
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Breadcrumbs, Link, Typography, useTheme } from '@mui/material';
import {
  ChartsThemeProvider,
  ErrorAlert,
  ErrorBoundary,
  generateChartsTheme,
  PersesChartsTheme,
} from '@perses-dev/components';
import { useMemo } from 'react';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { useBundledPlugins } from '../model/bundled-plugins';
import { useDashboard } from '../model/dashboard-client';
import { useDatasourceApi } from '../model/datasource-api';

// app specific echarts option overrides, empty since perses uses default
// https://apache.github.io/echarts-handbook/en/concepts/style/#theme
const ECHARTS_THEME_OVERRIDES = {};

interface DashboardBreadcrumbsProps {
  dashboardName: string;
  dashboardProject: string;
}

function DashboardBreadcrumbs(props: DashboardBreadcrumbsProps) {
  const { dashboardName, dashboardProject } = props;
  return (
    <Breadcrumbs sx={{ fontSize: 'large' }}>
      <Link underline={'hover'} variant={'h2'} component={RouterLink} to={`/projects/${dashboardProject}`}>
        {dashboardProject}
      </Link>
      <Typography variant={'h2'}>{dashboardName}</Typography>
    </Breadcrumbs>
  );
}

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard() {
  const { getInstalledPlugins, importPluginModule } = useBundledPlugins();
  const muiTheme = useTheme();
  const chartsTheme: PersesChartsTheme = useMemo(() => {
    return generateChartsTheme('perses', muiTheme, ECHARTS_THEME_OVERRIDES);
  }, [muiTheme]);

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
        <ChartsThemeProvider themeName="perses" chartsTheme={chartsTheme}>
          <PluginRegistry getInstalledPlugins={getInstalledPlugins} importPluginModule={importPluginModule}>
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
        </ChartsThemeProvider>
      </ErrorBoundary>
    </Box>
  );
}

export default ViewDashboard;
