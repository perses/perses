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

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import {
  EphemeralDashboardResource,
  getResourceExtendedDisplayName,
  DEFAULT_DASHBOARD_DURATION,
  DEFAULT_REFRESH_INTERVAL,
  DashboardResource,
  EphemeralDashboardSpec,
  DurationString,
} from '@perses-dev/core';
import { ReactElement, useCallback } from 'react';
import { useCreateEphemeralDashboardMutation } from '../../../model/ephemeral-dashboard-client';
import { generateMetadataName } from '../../../utils/metadata';
import { HelperDashboardView } from './HelperDashboardView';

export interface CreateEphemeralDashboardState {
  name: string;
  spec?: EphemeralDashboardSpec;
  ttl: DurationString;
}

/**
 * The View for creating a new EphemeralDashboard.
 */
function CreateEphemeralDashboardView(): ReactElement | null {
  const { projectName } = useParams();
  const location = useLocation();
  const state: CreateEphemeralDashboardState = location.state;

  if (!projectName || !state.name) {
    throw new Error('Unable to get the ephemeralDashboard or project name');
  }

  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createEphemeralDashboardMutation = useCreateEphemeralDashboardMutation();

  const data: EphemeralDashboardResource = {
    kind: 'EphemeralDashboard',
    metadata: {
      name: generateMetadataName(state.name),
      project: projectName,
      version: 0,
    },
    spec: state.spec ?? {
      ttl: state.ttl,
      display: {
        name: state.name,
      },
      duration: DEFAULT_DASHBOARD_DURATION,
      refreshInterval: DEFAULT_REFRESH_INTERVAL,
      variables: [],
      layouts: [],
      panels: {},
    },
  };

  const handleEphemeralDashboardSave = useCallback(
    (data: DashboardResource | EphemeralDashboardResource) => {
      if (data.kind !== 'EphemeralDashboard') {
        throw new Error('Invalid kind');
      }
      return createEphemeralDashboardMutation.mutateAsync(data, {
        onSuccess: (createdEphemeralDashboard: EphemeralDashboardResource) => {
          successSnackbar(
            `Ephemeral Dashboard ${getResourceExtendedDisplayName(
              createdEphemeralDashboard
            )} has been successfully created`
          );
          navigate(
            `/projects/${createdEphemeralDashboard.metadata.project}/ephemeralDashboards/${createdEphemeralDashboard.metadata.name}`
          );
          return createdEphemeralDashboard;
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [createEphemeralDashboardMutation, exceptionSnackbar, navigate, successSnackbar]
  );

  const handleEphemeralDashboardDiscard = useCallback(() => {
    navigate(`/projects/${projectName}`);
  }, [navigate, projectName]);

  if (!data || data.spec === undefined) return null;

  return (
    <HelperDashboardView
      dashboardResource={data as unknown as DashboardResource}
      onSave={handleEphemeralDashboardSave}
      onDiscard={handleEphemeralDashboardDiscard}
      isReadonly={false}
      isEditing={true}
      isCreating={true}
    />
  );
}

export default CreateEphemeralDashboardView;
