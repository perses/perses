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

import { Box, BoxProps } from '@mui/material';
import { TimeRangeProvider, useInitialRefreshInterval, useInitialTimeRange } from '@perses-dev/plugin-system';
import { DEFAULT_DASHBOARD_DURATION, DEFAULT_REFRESH_INTERVAL, DashboardResource } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary, combineSx } from '@perses-dev/components';
import {
  DatasourceStoreProviderProps,
  TemplateVariableProviderProps,
  DatasourceStoreProvider,
  DashboardProvider,
  TemplateVariableProvider,
} from '@perses-dev/dashboards';
import { ViewExploreApp } from './ViewExploreApp';
export interface ViewExploreProps extends Omit<BoxProps, 'children'> {
  dashboardResource: DashboardResource;
  datasourceApi: DatasourceStoreProviderProps['datasourceApi'];
  externalVariableDefinitions?: TemplateVariableProviderProps['externalVariableDefinitions'];
  exploreTitleComponent?: JSX.Element;
}

export function ViewExplore(props: ViewExploreProps) {
  const { dashboardResource, datasourceApi, externalVariableDefinitions, sx, exploreTitleComponent, ...others } = props;

  const initialTimeRange = useInitialTimeRange(DEFAULT_DASHBOARD_DURATION);
  const initialRefreshInterval = useInitialRefreshInterval(DEFAULT_REFRESH_INTERVAL);

  return (
    <DatasourceStoreProvider dashboardResource={dashboardResource} datasourceApi={datasourceApi}>
      <DashboardProvider initialState={{ dashboardResource, isEditMode: true }}>
        <TimeRangeProvider
          initialTimeRange={initialTimeRange}
          initialRefreshInterval={initialRefreshInterval}
          enabledURLParams={true}
        >
          <TemplateVariableProvider externalVariableDefinitions={externalVariableDefinitions}>
            <Box
              sx={combineSx(
                {
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                },
                sx
              )}
              {...others}
            >
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <ViewExploreApp exploreTitleComponent={exploreTitleComponent} />
              </ErrorBoundary>
            </Box>
          </TemplateVariableProvider>
        </TimeRangeProvider>
      </DashboardProvider>
    </DatasourceStoreProvider>
  );
}
