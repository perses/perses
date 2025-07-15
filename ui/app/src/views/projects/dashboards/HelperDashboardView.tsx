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

import { Box, CircularProgress, Stack } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import {
  DashboardResource,
  DatasourceSpec,
  EphemeralDashboardResource,
  getResourceDisplayName,
} from '@perses-dev/core';
import { ExternalVariableDefinition, OnSaveDashboard, ViewDashboard } from '@perses-dev/dashboards';
import {
  PluginRegistry,
  UsageMetricsProvider,
  ValidationProvider,
  remotePluginLoader,
} from '@perses-dev/plugin-system';
import { ReactElement, useMemo } from 'react';
import ProjectBreadcrumbs from '../../../components/breadcrumbs/ProjectBreadcrumbs';
import { buildProxyUrl, useAllDatasourceResources } from '../../../model/datasource-api';
import { useGlobalVariableList } from '../../../model/global-variable-client';
import { useProject } from '../../../model/project-client';
import { useVariableList } from '../../../model/variable-client';
import { buildGlobalVariableDefinition, buildProjectVariableDefinition } from '../../../utils/variables';
import { useIsLocalDatasourceEnabled, useIsLocalVariableEnabled } from '../../../context/Config';

export interface GenericDashboardViewProps {
  dashboardResource: DashboardResource | EphemeralDashboardResource;
  onSave?: OnSaveDashboard;
  onDiscard?: (entity: DashboardResource) => void;
  isReadonly: boolean;
  isEditing: boolean;
  isCreating?: boolean;
}

/**
 * The View for displaying a Dashboard.
 */
export function HelperDashboardView(props: GenericDashboardViewProps): ReactElement {
  const { dashboardResource, onSave, onDiscard, isReadonly, isEditing, isCreating } = props;

  /* TODO: This will be removed after the dashboard local datasource refactor */
  const dashboardResourceWithProxy = useMemo(
    () => ({
      ...dashboardResource,
      spec: {
        ...dashboardResource.spec,
        datasources: Object.entries(dashboardResource.spec.datasources || {}).reduce<Record<string, DatasourceSpec>>(
          (prev, current) => {
            const [key, spec] = current;
            return {
              ...prev,
              [key]: {
                ...spec,
                proxyUrl: buildProxyUrl({
                  project: dashboardResource.metadata.project,
                  dashboard: dashboardResource.metadata.name,
                  name: key,
                }),
              },
            };
          },
          {}
        ),
      },
    }),
    [dashboardResource]
  );

  const isLocalDatasourceEnabled = useIsLocalDatasourceEnabled();
  const isLocalVariableEnabled = useIsLocalVariableEnabled();
  const { datasources: allDatasources, isLoading: isAllDatasourcesLoading } = useAllDatasourceResources({
    project: dashboardResourceWithProxy.metadata.project,
    dashboard: dashboardResourceWithProxy.metadata.name,
  });
  // Collect the Project variables and setup external variables from it
  const { data: project, isLoading: isLoadingProject } = useProject(dashboardResourceWithProxy.metadata.project);
  const { data: globalVars, isLoading: isLoadingGlobalVars } = useGlobalVariableList();
  const { data: projectVars, isLoading: isLoadingProjectVars } = useVariableList(
    dashboardResourceWithProxy.metadata.project
  );
  const externalVariableDefinitions: ExternalVariableDefinition[] | undefined = useMemo(
    () => [
      buildProjectVariableDefinition(dashboardResourceWithProxy.metadata.project, projectVars ?? []),
      buildGlobalVariableDefinition(globalVars ?? []),
    ],
    [dashboardResourceWithProxy, projectVars, globalVars]
  );

  if (isLoadingProject || isLoadingProjectVars || isLoadingGlobalVars || isAllDatasourcesLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!project) {
    throw new Error('Unable to get the project');
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        overflow: 'hidden',
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <PluginRegistry
          pluginLoader={remotePluginLoader()}
          defaultPluginKinds={{
            Panel: 'TimeSeriesChart',
            TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
          }}
        >
          <ValidationProvider>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <UsageMetricsProvider project={project.metadata.name} dashboard={dashboardResource.metadata.name}>
                <ViewDashboard
                  datasources={allDatasources}
                  dashboardResource={dashboardResource}
                  externalVariableDefinitions={externalVariableDefinitions}
                  dashboardTitleComponent={
                    <ProjectBreadcrumbs dashboardName={getResourceDisplayName(dashboardResource)} project={project} />
                  }
                  emptyDashboardProps={{
                    additionalText: 'In order to save this dashboard, you need to add at least one panel!',
                  }}
                  onSave={onSave}
                  onDiscard={onDiscard}
                  initialVariableIsSticky={true}
                  isReadonly={isReadonly}
                  isVariableEnabled={isLocalVariableEnabled}
                  isDatasourceEnabled={isLocalDatasourceEnabled}
                  isEditing={isEditing}
                  isCreating={isCreating}
                />
              </UsageMetricsProvider>
            </ErrorBoundary>
          </ValidationProvider>
        </PluginRegistry>
      </ErrorBoundary>
    </Box>
  );
}
