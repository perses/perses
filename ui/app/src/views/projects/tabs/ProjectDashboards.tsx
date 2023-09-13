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

import { useNavigate } from 'react-router-dom';
import { Box, Card } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { useCallback, useState } from 'react';
import { DashboardSelector } from '@perses-dev/core';
import { useDashboardList } from '../../../model/dashboard-client';
import { DashboardList } from '../../../components/DashboardList/DashboardList';
import { CreateDashboardDialog } from '../../../components/dialogs';

interface ProjectDashboardsProps {
  projectName: string;
  hideToolbar?: boolean;
  id?: string;
}

export function ProjectDashboards(props: ProjectDashboardsProps) {
  const navigate = useNavigate();

  const [openCreateDashboardDialogState, setOpenCreateDashboardDialogState] = useState(false);

  const { data, isLoading } = useDashboardList(props.projectName);

  const handleDashboardCreation = useCallback(
    (dashboardSelector: DashboardSelector) =>
      navigate(`/projects/${dashboardSelector.project}/dashboard/new`, { state: dashboardSelector.dashboard }),
    [navigate]
  );

  return (
    <Box id={props.id}>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <Card>
          <DashboardList
            dashboardList={data ?? []}
            hideToolbar={props.hideToolbar}
            isLoading={isLoading}
            initialState={{
              columns: {
                columnVisibilityModel: {
                  id: false,
                  project: false,
                  version: false,
                },
              },
            }}
          />
        </Card>
      </ErrorBoundary>
      <CreateDashboardDialog
        open={openCreateDashboardDialogState}
        projectOptions={[props.projectName]}
        onClose={() => setOpenCreateDashboardDialogState(false)}
        onSuccess={handleDashboardCreation}
      />
    </Box>
  );
}
