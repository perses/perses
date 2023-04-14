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

import { ViewDashboard as DashboardView } from '@perses-dev/dashboards';
import { useNavigate, useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginRegistry } from '@perses-dev/plugin-system';
import { DashboardResource, dashboardDisplayName, dashboardExtendedDisplayName } from '@perses-dev/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bundledPluginLoader } from '../model/bundled-plugins';
import { useCreateDashboardMutation, useDashboard, useUpdateDashboardMutation } from '../model/dashboard-client';
import DashboardBreadcrumbs from '../components/DashboardBreadcrumbs';
import { useIsReadonly } from '../model/config-client';
import { useSnackbar } from '../context/SnackbarProvider';
import { CreateAction } from '../model/action';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../model/datasource-api';
import { useNavHistoryDispatch } from '../context/DashboardNavHistory';

/**
 * Generated a resource name valid for the API.
 * By removing accents from alpha characters and replace specials character by underscores.
 * @param name
 */
function generateMetadataName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9_.:-]/g, '_');
}

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard() {
  const { projectName, dashboardName, action } = useParams();
  const actionRef = useRef(action?.toLowerCase());

  if (projectName === undefined || dashboardName === undefined) {
    throw new Error('Unable to get the dashboard or project name');
  }

  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar, warningSnackbar } = useSnackbar();
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listDatasources(projectName);
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi, projectName]);
  const { isLoading } = useDashboard(projectName, dashboardName);
  let { data } = useDashboard(projectName, dashboardName);
  const isReadonly = useIsReadonly();

  const createDashboardMutation = useCreateDashboardMutation();
  const updateDashboardMutation = useUpdateDashboardMutation();

  const navHistoryDispatch = useNavHistoryDispatch();
  useEffect(
    () => navHistoryDispatch({ project: projectName, name: dashboardName }),
    [navHistoryDispatch, projectName, dashboardName]
  );

  let isEditing = false;

  if (actionRef.current === CreateAction) {
    if (data !== undefined) {
      // Dashboard already exists in the API, the user is redirected to the existing dashboard
      actionRef.current = undefined;
      warningSnackbar(`Dashboard ${dashboardDisplayName(data)} already exists`);
      navigate(`/projects/${data.metadata.project}/dashboards/${data.metadata.name}`);
    } else {
      data = {
        kind: 'Dashboard',
        metadata: {
          name: generateMetadataName(dashboardName),
          project: projectName,
          version: 0,
        },
        spec: {
          display: {
            name: dashboardName,
          },
          duration: '5m',
          variables: [],
          layouts: [],
          panels: {},
        },
      } as unknown as DashboardResource;
      isEditing = true;
    }
  }

  const handleDashboardSave = useCallback(
    (data: DashboardResource) => {
      if (actionRef.current === CreateAction) {
        return createDashboardMutation.mutateAsync(data, {
          onSuccess: (createdDashboard: DashboardResource) => {
            actionRef.current = undefined;
            successSnackbar(`Dashboard ${dashboardDisplayName(createdDashboard)} has been successfully created`);
            navigate(`/projects/${createdDashboard.metadata.project}/dashboards/${createdDashboard.metadata.name}`);
            return createdDashboard;
          },
          onError: (err) => {
            exceptionSnackbar(err);
            throw err;
          },
        });
      }

      return updateDashboardMutation.mutateAsync(data, {
        onSuccess: (updatedDashboard: DashboardResource) => {
          successSnackbar(`Dashboard ${dashboardExtendedDisplayName(updatedDashboard)} has been successfully updated`);
          return updatedDashboard;
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [actionRef, createDashboardMutation, exceptionSnackbar, navigate, successSnackbar, updateDashboardMutation]
  );

  const handleDashboardDiscard = useCallback(() => {
    if (actionRef.current === CreateAction) {
      navigate(`/projects/${projectName}`);
    }
  }, [actionRef, navigate, projectName]);

  if (isLoading) return null;

  if (!data || data.spec === undefined || isReadonly === undefined) return null;

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
          pluginLoader={bundledPluginLoader}
          defaultPluginKinds={{
            Panel: 'TimeSeriesChart',
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <strong>I MADE A CHANGE</strong>
            <DashboardView
              dashboardResource={data}
              datasourceApi={datasourceApi}
              dashboardTitleComponent={
                <DashboardBreadcrumbs
                  dashboardName={dashboardDisplayName(data)}
                  dashboardProject={data.metadata.project}
                />
              }
              emptyDashboardProps={{
                additionalText: 'In order to create a new dashboard, you need to add at least one panel!',
              }}
              onSave={handleDashboardSave}
              onDiscard={handleDashboardDiscard}
              initialVariableIsSticky={true}
              isReadonly={isReadonly}
              isEditing={isEditing}
            />
          </ErrorBoundary>
        </PluginRegistry>
      </ErrorBoundary>
    </Box>
  );
}

export default ViewDashboard;
