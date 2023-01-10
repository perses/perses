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
import { useState } from 'react';
import { useDashboardList } from '../model/dashboard-client';
import DashboardList from '../components/DashboardList';
import { useSnackbar } from '../context/SnackbarProvider';
import { useDeleteProjectMutation } from '../model/project-client';
import DeleteProjectDialog from '../components/DeleteProjectDialog/DeleteProjectDialog';

interface RenderDashboardInProjectProperties {
  projectName: string;
}

function DashboardPageInProject(props: RenderDashboardInProjectProperties) {
  const { data } = useDashboardList(props.projectName);
  if (data === undefined) {
    return null;
  }
  return (
    <Paper>
      <Box p={1}>
        <Stack direction="row" alignItems="center" gap={1} my={2}>
          <ViewDashboard />
          <Typography variant="h3">Dashboards</Typography>
        </Stack>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <DashboardList dashboardList={data} />
        </ErrorBoundary>
      </Box>
    </Paper>
  );
}

function ViewProject() {
  const { projectName } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  const navigate = useNavigate();

  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);
  const handleDeleteProjectDialogOpen = () => {
    setIsDeleteProjectDialogOpen(true);
  };

  const handleDeleteProjectDialogClose = () => {
    setIsDeleteProjectDialogOpen(false);
  };

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteProjectMutation = useDeleteProjectMutation();
  const handleDeleteProjectDialogSubmit = function () {
    deleteProjectMutation.mutate(projectName, {
      onSuccess: (name: string) => {
        successSnackbar(`project ${name} was successfully deleted`);
      },
      onError: (err) => {
        exceptionSnackbar(err);
      },
      onSettled: () => {
        navigate(`/`);
      },
    });
  };
  return (
    <>
      <Container maxWidth="md">
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
        onSubmit={handleDeleteProjectDialogSubmit}
      />
    </>
  );
}

export default ViewProject;
