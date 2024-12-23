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
import { DashboardResource, EphemeralDashboardResource, getResourceExtendedDisplayName } from '@perses-dev/core';
import { ReactElement, useCallback, useEffect } from 'react';
import { useDashboard, useUpdateDashboardMutation } from '../../../model/dashboard-client';
import { useIsReadonly } from '../../../context/Config';
import { useNavHistoryDispatch } from '../../../context/DashboardNavHistory';
import { HelperDashboardView } from './HelperDashboardView';

/**
 * The View for displaying an existing Dashboard.
 */
function DashboardView(): ReactElement | null {
  const { projectName, dashboardName } = useParams();

  if (projectName === undefined || dashboardName === undefined) {
    throw new Error('Unable to get the dashboard or project name');
  }

  const navigate = useNavigate();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const { data, isLoading, error: dashboardNotFoundError } = useDashboard(projectName, dashboardName);
  const isReadonly = useIsReadonly();
  const updateDashboardMutation = useUpdateDashboardMutation();

  const navHistoryDispatch = useNavHistoryDispatch();
  useEffect(
    () => navHistoryDispatch({ project: projectName, name: dashboardName }),
    [navHistoryDispatch, projectName, dashboardName]
  );

  const handleDashboardSave = useCallback(
    (data: DashboardResource | EphemeralDashboardResource) => {
      if (data.kind !== 'Dashboard') {
        throw new Error('Invalid kind');
      }
      return updateDashboardMutation.mutateAsync(data, {
        onSuccess: (updatedDashboard: DashboardResource) => {
          successSnackbar(
            `Dashboard ${getResourceExtendedDisplayName(updatedDashboard)} has been successfully updated`
          );
          return updatedDashboard;
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, updateDashboardMutation]
  );

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }
  if (dashboardNotFoundError !== null) {
    exceptionSnackbar(dashboardNotFoundError);
    navigate(`/projects/${projectName}`);
  }
  if (!data || data.spec === undefined || isReadonly === undefined) return null;

  return (
    <HelperDashboardView
      dashboardResource={data}
      onSave={handleDashboardSave}
      isReadonly={isReadonly}
      isEditing={false}
    />
  );
}

export default DashboardView;
