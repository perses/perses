// Copyright 2024 The Perses Authors
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
import {
  BuiltinVariableDefinition,
  DEFAULT_DASHBAORD_TIMEZONE,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
} from '@perses-dev/core';
import { ErrorBoundary, ErrorAlert, combineSx } from '@perses-dev/components';
import {
  TimeRangeProviderWithQueryParams,
  useInitialRefreshInterval,
  useInitialTimeRange,
  usePluginBuiltinVariableDefinitions,
} from '@perses-dev/plugin-system';
import { ReactElement, useMemo } from 'react';
import {
  DatasourceStoreProviderProps,
  DatasourceStoreProvider,
  VariableProviderProps,
  VariableProviderWithQueryParams,
} from '../../context';
import { DashboardProviderWithQueryParams } from '../../context/DashboardProvider/DashboardProviderWithQueryParams';
import { DashboardApp, DashboardAppProps } from './DashboardApp';

export interface ViewDashboardProps extends Omit<BoxProps, 'children'>, DashboardAppProps {
  datasourceApi: DatasourceStoreProviderProps['datasourceApi'];
  externalVariableDefinitions?: VariableProviderProps['externalVariableDefinitions'];
  isEditing?: boolean;
  isCreating?: boolean;
}

/**
 * The View for displaying a Dashboard, along with the UI for selecting variable values.
 */
export function ViewDashboard(props: ViewDashboardProps): ReactElement {
  const {
    dashboardResource,
    datasourceApi,
    externalVariableDefinitions,
    dashboardTitleComponent,
    emptyDashboardProps,
    onSave,
    onDiscard,
    initialVariableIsSticky,
    isReadonly,
    isVariableEnabled,
    isDatasourceEnabled,
    isEditing,
    isCreating,
    sx,
    ...others
  } = props;
  const { spec } = dashboardResource;
  const dashboardDuration = spec.duration ?? DEFAULT_DASHBOARD_DURATION;
  const dashboardRefreshInterval = spec.refreshInterval ?? DEFAULT_REFRESH_INTERVAL;
  const initialTimeZone = spec.timeZone ?? DEFAULT_DASHBAORD_TIMEZONE;
  const initialTimeRange = useInitialTimeRange(dashboardDuration);
  const initialRefreshInterval = useInitialRefreshInterval(dashboardRefreshInterval);
  const { data } = usePluginBuiltinVariableDefinitions();

  const builtinVariables = useMemo(() => {
    const result = [
      {
        kind: 'BuiltinVariable',
        spec: {
          name: '__dashboard',
          value: () => dashboardResource.metadata.name,
          source: 'Dashboard',
          display: {
            name: '__dashboard',
            description: 'The name of the current dashboard',
            hidden: true,
          },
        },
      } as BuiltinVariableDefinition,
      {
        kind: 'BuiltinVariable',
        spec: {
          name: '__project',
          value: () => dashboardResource.metadata.project,
          source: 'Dashboard',
          display: {
            name: '__project',
            description: 'The name of the current dashboard project',
            hidden: true,
          },
        },
      } as BuiltinVariableDefinition,
    ];
    if (data) {
      data.forEach((def: BuiltinVariableDefinition) => result.push(def));
    }
    return result;
  }, [dashboardResource.metadata.name, dashboardResource.metadata.project, data]);

  return (
    <DatasourceStoreProvider dashboardResource={dashboardResource} datasourceApi={datasourceApi}>
      <DashboardProviderWithQueryParams
        initialState={{
          dashboardResource,
          isEditMode: !!isEditing,
        }}
      >
        <TimeRangeProviderWithQueryParams
          initialTimeRange={initialTimeRange}
          initialRefreshInterval={initialRefreshInterval}
          initialTimeZone={initialTimeZone}
        >
          <VariableProviderWithQueryParams
            initialVariableDefinitions={spec.variables}
            externalVariableDefinitions={externalVariableDefinitions}
            builtinVariableDefinitions={builtinVariables}
          >
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
                <DashboardApp
                  dashboardResource={dashboardResource}
                  dashboardTitleComponent={dashboardTitleComponent}
                  emptyDashboardProps={emptyDashboardProps}
                  onSave={onSave}
                  onDiscard={onDiscard}
                  initialVariableIsSticky={initialVariableIsSticky}
                  isReadonly={isReadonly}
                  isVariableEnabled={isVariableEnabled}
                  isDatasourceEnabled={isDatasourceEnabled}
                  isCreating={isCreating}
                />
              </ErrorBoundary>
            </Box>
          </VariableProviderWithQueryParams>
        </TimeRangeProviderWithQueryParams>
      </DashboardProviderWithQueryParams>
    </DatasourceStoreProvider>
  );
}
