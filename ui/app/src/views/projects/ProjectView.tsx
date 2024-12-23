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
import { Box, Stack, Grid, CircularProgress } from '@mui/material';
import React, { ReactElement, useState } from 'react';
import DeleteOutline from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { ProjectResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { DeleteResourceDialog, RenameResourceDialog } from '../../components/dialogs';
import ProjectBreadcrumbs from '../../components/breadcrumbs/ProjectBreadcrumbs';
import { CRUDButton } from '../../components/CRUDButton/CRUDButton';
import { useIsMobileSize } from '../../utils/browser-size';
import { useDeleteProjectMutation, useProject, useUpdateProjectMutation } from '../../model/project-client';
import { RecentlyViewedDashboards } from './RecentlyViewedDashboards';
import { ProjectTabs } from './ProjectTabs';

function ProjectView(): ReactElement {
  const { projectName, tab } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  const { data: project, isLoading } = useProject(projectName);
  // Navigate to the home page if the project has been successfully deleted
  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  // Open/Close management for the "Delete Project" dialog
  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);
  const [isRenameProjectDialogOpen, setIsRenameProjectDialogOpen] = useState<boolean>(false);

  function handleProjectRename(project: ProjectResource, projectName: string): void {
    updateProjectMutation.mutate(
      { ...project, spec: { display: { ...project.spec.display, name: projectName } } },
      {
        onSuccess: (updatedProject: ProjectResource) => {
          successSnackbar(`Project ${updatedProject.metadata.name} has been successfully updated`);
          setIsRenameProjectDialogOpen(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      }
    );
  }

  function handleProjectDelete(project: string): void {
    deleteProjectMutation.mutate(
      { kind: 'Project', metadata: { name: project }, spec: {} },
      {
        onSuccess: (deletedProject: ProjectResource) => {
          successSnackbar(`Project ${deletedProject.metadata.name} has been successfully deleted`);
          setIsDeleteProjectDialogOpen(false);
          navigate(`/`);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      }
    );
  }

  if (isLoading || project === undefined) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} mt={1.5} gap={1}>
      <Box display="flex" justifyContent="space-between" gap={1}>
        <ProjectBreadcrumbs project={project} />
        <Stack mt={0.5} gap={1} direction="row">
          <CRUDButton
            action="update"
            scope="Project"
            project={projectName}
            variant="contained"
            onClick={() => setIsRenameProjectDialogOpen(true)}
          >
            {isMobileSize ? <PencilIcon /> : 'Rename project'}
          </CRUDButton>
          <CRUDButton
            action="delete"
            scope="Project"
            project={projectName}
            variant="outlined"
            color="error"
            onClick={() => setIsDeleteProjectDialogOpen(true)}
          >
            {isMobileSize ? <DeleteOutline /> : 'Delete project'}
          </CRUDButton>
        </Stack>
        <RenameResourceDialog
          resource={project}
          open={isRenameProjectDialogOpen}
          onSubmit={(projectName) => handleProjectRename(project, projectName)}
          onClose={() => setIsRenameProjectDialogOpen(false)}
        />
        <DeleteResourceDialog
          resource={project}
          open={isDeleteProjectDialogOpen}
          onSubmit={() => handleProjectDelete(projectName)}
          onClose={() => setIsDeleteProjectDialogOpen(false)}
        />
      </Box>
      <Grid container columnSpacing={8} rowSpacing={1}>
        <Grid item xs={12} xl={8}>
          <ProjectTabs projectName={projectName} initialTab={tab} />
        </Grid>
        <Grid item xs={12} xl={4}>
          <RecentlyViewedDashboards projectName={projectName} id="recent-dashboard-list" />
        </Grid>
      </Grid>
    </Stack>
  );
}

export default ProjectView;
