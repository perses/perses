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

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import {
  DashboardResource,
  getDashboardExtendedDisplayName,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
} from '@perses-dev/core';
import { useCallback } from 'react';
import { useCreateDashboardMutation } from '../../../model/dashboard-client';
import { HelperDashboardView } from './HelperDashboardView';

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
 * The View for creating a new Dashboard.
 */
function CreateDashboardView() {
  const { projectName } = useParams();
  const location = useLocation();
  const dashboardName = location.state;

  if (projectName === undefined || dashboardName === undefined) {
    throw new Error('Unable to get the dashboard or project name');
  }

  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createDashboardMutation = useCreateDashboardMutation();

  const data: DashboardResource = {
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
      duration: DEFAULT_DASHBOARD_DURATION,
      refreshInterval: DEFAULT_REFRESH_INTERVAL,
      variables: [],
      layouts: [],
      panels: {},
    },
  };

  const handleDashboardSave = useCallback(
    (data: DashboardResource) => {
      return createDashboardMutation.mutateAsync(data, {
        onSuccess: (createdDashboard: DashboardResource) => {
          successSnackbar(
            `Dashboard ${getDashboardExtendedDisplayName(createdDashboard)} has been successfully created`
          );
          navigate(`/projects/${createdDashboard.metadata.project}/dashboards/${createdDashboard.metadata.name}`);
          return createdDashboard;
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [createDashboardMutation, exceptionSnackbar, navigate, successSnackbar]
  );

  const handleDashboardDiscard = useCallback(() => {
    navigate(`/projects/${projectName}`);
  }, [navigate, projectName]);

  if (!data || data.spec === undefined) return null;

  return (
    <HelperDashboardView
      dashboardResource={data}
      onSave={handleDashboardSave}
      onDiscard={handleDashboardDiscard}
      isReadonly={false}
      isEditing={true}
      isCreating={true}
    />
  );
}

export default CreateDashboardView;
