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
  EphemeralDashboardResource,
  getResourceDisplayName,
  ExternalVariableDefinition,
} from '@perses-dev/core';
import { OnSaveDashboard, ViewDashboard } from '@perses-dev/dashboards';
import { PluginRegistry, UsageMetricsProvider, ValidationProvider } from '@perses-dev/plugin-system';
import { ReactElement, useMemo } from 'react';
import ProjectBreadcrumbs from '../../../components/breadcrumbs/ProjectBreadcrumbs';
import { useDatasourceApi } from '../../../model/datasource-api';
import { useProject } from '../../../model/project-client';
import { useVariableList } from '../../../model/variable-client';
import { buildProjectVariableDefinition } from '../../../utils/variables';
import { useIsLocalDatasourceEnabled, useIsLocalVariableEnabled } from '../../../context/Config';
import { useRemotePluginLoader } from '../../../model/remote-plugin-loader';
import { PERSES_APP_CONFIG } from '../../../config';

export interface GenericDashboardViewProps {
  dashboardResource: DashboardResource | EphemeralDashboardResource;
  onSave?: OnSaveDashboard;
  onDiscard?: (entity: DashboardResource) => void;
  isReadonly: boolean;
  isEditing: boolean;
  isCreating?: boolean;
  isLeavingConfirmDialogEnabled?: boolean;
}

/**
 * The View for displaying a Dashboard.
 */
export function HelperDashboardView(props: GenericDashboardViewProps): ReactElement {
  const {
    dashboardResource,
    onSave,
    onDiscard,
    isReadonly,
    isEditing,
    isCreating,
    isLeavingConfirmDialogEnabled = true,
  } = props;

  const isLocalDatasourceEnabled = useIsLocalDatasourceEnabled();
  const isLocalVariableEnabled = useIsLocalVariableEnabled();
  const datasourceApi = useDatasourceApi(dashboardResource.metadata.project);
  const pluginLoader = useRemotePluginLoader();

  // Collect the Project variables and setup external variables from it
  const { data: project, isLoading: isLoadingProject } = useProject(dashboardResource.metadata.project);
  const { data: projectVars, isLoading: isLoadingProjectVars } = useVariableList(dashboardResource.metadata.project);
  const externalVariableDefinitions: ExternalVariableDefinition[] | undefined = useMemo(
    () => [buildProjectVariableDefinition(dashboardResource.metadata.project, projectVars ?? [])],
    [dashboardResource, projectVars]
  );

  if (isLoadingProject || isLoadingProjectVars) {
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
          pluginLoader={pluginLoader}
          defaultPluginKinds={{
            Panel: 'TimeSeriesChart',
            TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
          }}
        >
          <ValidationProvider>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <UsageMetricsProvider
                apiPrefix={PERSES_APP_CONFIG.api_prefix}
                project={project.metadata.name}
                dashboard={dashboardResource.metadata.name}
              >
                <ViewDashboard
                  dashboardResource={dashboardResource}
                  datasourceApi={datasourceApi}
                  externalVariableDefinitions={externalVariableDefinitions}
                  dashboardTitleComponent={
                    <ProjectBreadcrumbs dashboardName={getResourceDisplayName(dashboardResource)} folder={dashboardResource.metadata.folder} project={project} />
                  }
                  emptyDashboardProps={{
                    additionalText: 'In order to save this dashboard, you need to add at least one panel!',
                  }}
                  onSave={onSave}
                  onDiscard={onDiscard}
                  isInitialVariableSticky={true}
                  isReadonly={isReadonly}
                  isVariableEnabled={isLocalVariableEnabled}
                  isDatasourceEnabled={isLocalDatasourceEnabled}
                  isEditing={isEditing}
                  isCreating={isCreating}
                  isLeavingConfirmDialogEnabled={isLeavingConfirmDialogEnabled}
                />
              </UsageMetricsProvider>
            </ErrorBoundary>
          </ValidationProvider>
        </PluginRegistry>
      </ErrorBoundary>
    </Box>
  );
}
