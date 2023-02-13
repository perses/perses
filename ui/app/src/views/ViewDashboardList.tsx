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

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Link,
  Stack,
  Typography,
} from '@mui/material';

import { MouseEvent, useCallback, useState } from 'react';
import { DashboardResource } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import FolderPound from 'mdi-material-ui/FolderPound';
import DeleteOutline from 'mdi-material-ui/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { useDashboardList } from '../model/dashboard-client';
import { ProjectModel } from '../model/project-client';
import DashboardList from '../components/DashboardList';
import DeleteProjectDialog from '../components/DeleteProjectDialog/DeleteProjectDialog';
import AddProjectDialog from '../components/AddProjectDialog/AddProjectDialog';

function RenderDashboardList() {
  const [openDeleteProjectDialog, setOpenDeleteProjectDialog] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<string>();

  const openDeleteProjectConfirmDialog = ($event: MouseEvent, name: string) => {
    $event.stopPropagation(); // Preventing the accordion to toggle when we click on the button
    setProjectToDelete(name);
    setOpenDeleteProjectDialog(true);
  };

  const closeDeleteProjectConfirmDialog = () => {
    setOpenDeleteProjectDialog(false);
  };

  const { data, isLoading } = useDashboardList();
  if (isLoading) {
    return <CircularProgress />;
  }

  if (data === undefined || data === null) return null;

  const dashboardListAsMap = new Map<string, DashboardResource[]>();
  if (Array.isArray(data)) {
    data.map((dashboard) => {
      const project = dashboard.metadata.project;
      const list = dashboardListAsMap.get(project);
      if (list !== undefined) {
        list.push(dashboard);
      } else {
        dashboardListAsMap.set(project, [dashboard]);
      }
    });
  }

  const accordions: JSX.Element[] = [];
  dashboardListAsMap.forEach((list, projectName: string) => {
    const projectLink = `/projects/${projectName}`;
    accordions.push(
      <Accordion TransitionProps={{ unmountOnExit: true }} key={projectName}>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
            <Stack direction="row" alignItems="center" gap={1}>
              <FolderPound />
              <Link href={projectLink} variant="h3" underline="hover">
                {projectName}
              </Link>
            </Stack>
            <IconButton onClick={(event: MouseEvent) => openDeleteProjectConfirmDialog(event, projectName)}>
              <DeleteOutline />
            </IconButton>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <DashboardList dashboardList={list} />
        </AccordionDetails>
      </Accordion>
    );
  });

  return (
    <>
      <Box>{accordions}</Box>
      <DeleteProjectDialog
        name={projectToDelete || ''}
        open={openDeleteProjectDialog}
        onClose={closeDeleteProjectConfirmDialog}
      />
    </>
  );
}

function ViewDashboardList() {
  // Navigate to the project page if the project has been successfully added
  const navigate = useNavigate();
  const handleAddProjectDialogSubmit = useCallback(
    (entity: ProjectModel) => navigate(`/projects/${entity.metadata.name}`),
    [navigate]
  );

  // Open/Close management for the "Create Project" dialog
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const handleAddProjectDialogOpen = () => {
    setIsAddProjectDialogOpen(true);
  };
  const handleAddProjectDialogClose = () => {
    setIsAddProjectDialogOpen(false);
  };

  return (
    <Container maxWidth="md" sx={{ marginY: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" justifyContent="start" gap={1} my={2}>
          <Typography variant="h2">All Dashboards</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" justifyContent="end" gap={1} my={2}>
          <Button variant="outlined" size="small" onClick={handleAddProjectDialogOpen}>
            Add Project
          </Button>
        </Stack>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <RenderDashboardList />
      </ErrorBoundary>
      <AddProjectDialog
        open={isAddProjectDialogOpen}
        onClose={handleAddProjectDialogClose}
        onSuccess={handleAddProjectDialogSubmit}
      />
    </Container>
  );
}

export default ViewDashboardList;
