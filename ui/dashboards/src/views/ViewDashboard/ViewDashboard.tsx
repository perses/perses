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
import { BuiltinVariableDefinition, DEFAULT_DASHBOARD_DURATION, DEFAULT_REFRESH_INTERVAL } from '@perses-dev/core';
import { ErrorBoundary, ErrorAlert, combineSx } from '@perses-dev/components';
import {
  BuiltinVariables,
  TimeRangeProvider,
  useInitialRefreshInterval,
  useInitialTimeRange,
} from '@perses-dev/plugin-system';
import {
  TemplateVariableProvider,
  DashboardProvider,
  DatasourceStoreProviderProps,
  DatasourceStoreProvider,
  TemplateVariableProviderProps,
} from '../../context';
import { DashboardApp, DashboardAppProps } from './DashboardApp';

export interface ViewDashboardProps extends Omit<BoxProps, 'children'>, DashboardAppProps {
  datasourceApi: DatasourceStoreProviderProps['datasourceApi'];
  externalVariableDefinitions?: TemplateVariableProviderProps['externalVariableDefinitions'];
  isEditing?: boolean;
}

/**
 * The View for displaying a Dashboard, along with the UI for selecting variable values.
 */
export function ViewDashboard(props: ViewDashboardProps) {
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
    isEditing,
    sx,
    ...others
  } = props;
  const { spec } = dashboardResource;
  const dashboardDuration = spec.duration ?? DEFAULT_DASHBOARD_DURATION;
  const dashboardRefreshInterval = spec.refreshInterval ?? DEFAULT_REFRESH_INTERVAL;
  const initialTimeRange = useInitialTimeRange(dashboardDuration);
  const initialRefreshInterval = useInitialRefreshInterval(dashboardRefreshInterval);

  const dashboardBuiltinVariables: BuiltinVariables = {
    __dashboard: {
      kind: 'BuiltinVariable',
      spec: {
        name: '__dashboard',
        value: () => dashboardResource.metadata.name,
        display: {
          name: '__dashboard',
          description: 'The name of the current dashboard',
          hidden: true,
        },
      },
    } as BuiltinVariableDefinition,
    __project: {
      kind: 'BuiltinVariable',
      spec: {
        name: '__project',
        value: () => dashboardResource.metadata.project,
        display: {
          name: '__project',
          description: 'The name of the current dashboard project',
          hidden: true,
        },
      },
    } as BuiltinVariableDefinition,
    // TODO: retrieve plugin specific builtin var definitions automatically from loaded plugins
    __interval: {
      kind: 'BuiltinVariable',
      spec: {
        name: '__interval',
        value: () => '$__interval', // will be overriden by supported plugins
        display: {
          name: '__interval',
          description:
            'Interval that can be used to group by time in queries. When there are more data points than can be shown on a graph then queries can be made more efficient by grouping by a larger interval. RESERVED TO PROMETHEUS QUERIES ONLY!',
          hidden: true,
        },
      },
    },
    __interval_ms: {
      kind: 'BuiltinVariable',
      spec: {
        name: '__interval_ms',
        value: () => '$__interval_ms', // will be overriden by supported plugins
        display: {
          name: '__interval_ms',
          description:
            'Interval in millisecond that can be used to group by time in queries. When there are more data points than can be shown on a graph then queries can be made more efficient by grouping by a larger interval. RESERVED TO PROMETHEUS QUERIES ONLY!',
          hidden: true,
        },
      },
    },
    __rate_interval: {
      kind: 'BuiltinVariable',
      spec: {
        name: '__rate_interval',
        value: () => '$__rate_interval', // will be overriden by supported plugins
        display: {
          name: '__rate_interval',
          description:
            "Interval at least four times the value of the scrape interval, it avoid problems specific to Prometheus when using 'rate' and 'increase' functions. RESERVED TO PROMETHEUS QUERIES ONLY!",
          hidden: true,
        },
      },
    },
  };

  return (
    <DatasourceStoreProvider dashboardResource={dashboardResource} datasourceApi={datasourceApi}>
      <DashboardProvider initialState={{ dashboardResource, isEditMode: !!isEditing }}>
        <TimeRangeProvider
          initialTimeRange={initialTimeRange}
          initialRefreshInterval={initialRefreshInterval}
          enabledURLParams={true}
        >
          <TemplateVariableProvider
            initialVariableDefinitions={spec.variables}
            externalVariableDefinitions={externalVariableDefinitions}
            builtinVariables={dashboardBuiltinVariables}
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
                />
              </ErrorBoundary>
            </Box>
          </TemplateVariableProvider>
        </TimeRangeProvider>
      </DashboardProvider>
    </DatasourceStoreProvider>
  );
}
