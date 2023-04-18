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
import { Box, Stack, Typography, Button, Card } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import ViewDashboard from 'mdi-material-ui/ViewDashboard';
import { useCallback, useState } from 'react';
import { useDashboardList } from '../../model/dashboard-client';
import { DashboardList } from '../../components/DashboardList/DashboardList';
import { CreateDashboardDialog } from '../../components/CreateDashboardDialog/CreateDashboardDialog';

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
    (name: string) => {
      navigate(`/projects/${props.projectName}/dashboards/${name}/create`);
    },
    [navigate, props.projectName]
  );

  return (
    <Box id={props.id}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={1} my={2}>
          <ViewDashboard />
          <Typography variant="h3">Dashboards</Typography>
        </Stack>
        <Button
          variant="contained"
          size="small"
          sx={{ textTransform: 'uppercase' }}
          onClick={() => setOpenCreateDashboardDialogState(true)}
        >
          Add Dashboard
        </Button>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <Card>
          <DashboardList dashboardList={data || []} hideToolbar={props.hideToolbar} isLoading={isLoading} />
        </Card>
      </ErrorBoundary>
      <CreateDashboardDialog
        open={openCreateDashboardDialogState}
        onClose={() => setOpenCreateDashboardDialogState(false)}
        onSuccess={(name: string) => handleDashboardCreation(name)}
      />
    </Box>
  );
}
