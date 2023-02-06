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

import { useNavigate, useParams } from 'react-router-dom';
import { Box, Container, Paper, Stack, Typography, Button } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import FolderPound from 'mdi-material-ui/FolderPound';
import ViewDashboard from 'mdi-material-ui/ViewDashboard';
import { useCallback, useState } from 'react';
import { useDashboardList } from '../model/dashboard-client';
import DashboardList from '../components/DashboardList';
import DeleteProjectDialog from '../components/DeleteProjectDialog/DeleteProjectDialog';
import { useSnackbar } from '../context/SnackbarProvider';
import { CreateDashboardDialog } from '../components/CreateDashboardDialog/CreateDashboardDialog';

interface RenderDashboardInProjectProperties {
  projectName: string;
}

function DashboardPageInProject(props: RenderDashboardInProjectProperties) {
  const { infoSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [openCreateDashboardDialogState, setOpenCreateDashboardDialogState] = useState(false);

  const { data } = useDashboardList(props.projectName);
  if (data === undefined) {
    return null;
  }

  const handleDashboardCreation = function (name: string) {
    navigate(`/projects/${props.projectName}/dashboards/${name}/create`);
    infoSnackbar(`In order to create a new dashboard. You need to add at least one panel!`);
  };

  return (
    <Paper>
      <Box p={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1} my={2}>
            <ViewDashboard />
            <Typography variant="h3">Dashboards</Typography>
          </Stack>
          <Button variant="contained" size="small" onClick={() => setOpenCreateDashboardDialogState(true)}>
            Add Dashboard
          </Button>
        </Stack>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <DashboardList dashboardList={data} />
        </ErrorBoundary>
        <CreateDashboardDialog
          open={openCreateDashboardDialogState}
          onClose={() => setOpenCreateDashboardDialogState(false)}
          onSuccess={(name: string) => handleDashboardCreation(name)}
        />
      </Box>
    </Paper>
  );
}

function ViewProject() {
  const { projectName } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  // Navigate to the home page if the project has been successfully deleted
  const navigate = useNavigate();
  const handleDeleteProjectDialogSuccess = useCallback(() => navigate(`/`), [navigate]);

  // Open/Close management for the "Delete Project" dialog
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);
  const handleDeleteProjectDialogOpen = useCallback(
    () => setIsDeleteProjectDialogOpen(true),
    [setIsDeleteProjectDialogOpen]
  );
  const handleDeleteProjectDialogClose = useCallback(
    () => setIsDeleteProjectDialogOpen(false),
    [setIsDeleteProjectDialogOpen]
  );

  return (
    <>
      <Container maxWidth="md" sx={{ marginY: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1} mb={2}>
            <FolderPound fontSize={'large'} />
            <Typography variant="h1">{projectName}</Typography>
          </Stack>
          <Button variant="outlined" color="error" size="small" onClick={handleDeleteProjectDialogOpen}>
            Delete
          </Button>
        </Stack>
        <DashboardPageInProject projectName={projectName} />
      </Container>
      <DeleteProjectDialog
        name={projectName}
        open={isDeleteProjectDialogOpen}
        onClose={handleDeleteProjectDialogClose}
        onSuccess={handleDeleteProjectDialogSuccess}
      />
    </>
  );
}

export default ViewProject;
