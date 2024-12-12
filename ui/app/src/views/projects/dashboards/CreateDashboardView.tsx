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
  getResourceExtendedDisplayName,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
  DashboardSpec,
  EphemeralDashboardResource,
} from '@perses-dev/core';
import { ReactElement, useCallback } from 'react';
import { useCreateDashboardMutation } from '../../../model/dashboard-client';
import { generateMetadataName } from '../../../utils/metadata';
import { HelperDashboardView } from './HelperDashboardView';

export interface CreateDashboardState {
  name: string;
  spec?: DashboardSpec;
}

/**
 * The View for creating a new Dashboard.
 */
function CreateDashboardView(): ReactElement | null {
  const { projectName } = useParams();
  const location = useLocation();
  const state: CreateDashboardState = location.state;
  const dashboardName = state.name;

  if (!projectName || !dashboardName) {
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
    spec: state.spec ?? {
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
    (data: DashboardResource | EphemeralDashboardResource) => {
      if (data.kind !== 'Dashboard') {
        throw new Error('Invalid kind');
      }
      return createDashboardMutation.mutateAsync(data, {
        onSuccess: (createdDashboard: DashboardResource) => {
          successSnackbar(
            `Dashboard ${getResourceExtendedDisplayName(createdDashboard)} has been successfully created`
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
