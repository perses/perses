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

import { CircularProgress, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '@perses-dev/components';
import { DashboardResource, EphemeralDashboardResource, getDashboardExtendedDisplayName } from '@perses-dev/core';
import { useCallback, useEffect } from 'react';
import { useEphemeralDashboard, useUpdateEphemeralDashboardMutation } from '../../../model/ephemeral-dashboard-client';
import { useIsReadonly } from '../../../context/Config';
import { useNavHistoryDispatch } from '../../../context/DashboardNavHistory';
import { HelperDashboardView } from './HelperDashboardView';

/**
 * The View for displaying an existing EphemeralDashboard.
 */
function EphemeralDashboardView() {
  const { projectName, ephemeralDashboardName } = useParams();

  if (projectName === undefined || ephemeralDashboardName === undefined) {
    throw new Error('Unable to get the ephemeralDashboard or project name');
  }

  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const {
    data,
    isLoading,
    error: ephemeralDashboardNotFoundError,
  } = useEphemeralDashboard(projectName, ephemeralDashboardName);
  const isReadonly = useIsReadonly();
  const updateEphemeralDashboardMutation = useUpdateEphemeralDashboardMutation();

  const navHistoryDispatch = useNavHistoryDispatch();
  useEffect(
    () => navHistoryDispatch({ project: projectName, name: ephemeralDashboardName }),
    [navHistoryDispatch, projectName, ephemeralDashboardName]
  );

  const handleEphemeralDashboardSave = useCallback(
    (data: DashboardResource | EphemeralDashboardResource) => {
      if (data.kind !== 'EphemeralDashboard') {
        throw new Error('Invalid kind');
      }
      return updateEphemeralDashboardMutation.mutateAsync(data, {
        onSuccess: (updatedEphemeralDashboard: EphemeralDashboardResource) => {
          successSnackbar(
            `EphemeralDashboard ${getDashboardExtendedDisplayName(
              updatedEphemeralDashboard as unknown as DashboardResource
            )} has been successfully updated`
          );
          return updatedEphemeralDashboard;
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, updateEphemeralDashboardMutation]
  );

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }
  if (ephemeralDashboardNotFoundError !== null) {
    exceptionSnackbar(ephemeralDashboardNotFoundError);
    navigate(`/projects/${projectName}`);
  }
  if (!data || data.spec === undefined || isReadonly === undefined) return null;

  return (
    <HelperDashboardView
      dashboardResource={data}
      onSave={handleEphemeralDashboardSave}
      isReadonly={isReadonly}
      isEditing={false}
    />
  );
}

export default EphemeralDashboardView;
