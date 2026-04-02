// Copyright The Perses Authors
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
import {
  Stack,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from '@mui/material';
import React, { ReactElement, useState } from 'react';
import DeleteOutline from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import DotsVertical from 'mdi-material-ui/DotsVertical';
import { ProjectResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { DeleteResourceDialog, RenameResourceDialog } from '../../components/dialogs';
import ProjectBreadcrumbs from '../../components/breadcrumbs/ProjectBreadcrumbs';
import { useIsMobileSize } from '../../utils/browser-size';
import { useIsReadonly } from '../../context/Config';
import { useHasPermission } from '../../context/Authorization';
import { useDeleteProjectMutation, useProject, useUpdateProjectMutation } from '../../model/project-client';
import { ProjectTabs } from './ProjectTabs';

function ProjectView(): ReactElement {
  const { projectName, tab } = useParams();
  if (projectName === undefined) {
    throw new Error('Unable to get the project name');
  }

  const { data: project, isLoading } = useProject(projectName);
  const navigate = useNavigate();
  const isMobileSize = useIsMobileSize();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const isReadonly = useIsReadonly();
  const canUpdate = useHasPermission('update', projectName, 'Project');
  const canDelete = useHasPermission('delete', projectName, 'Project');

  const updateProjectMutation = useUpdateProjectMutation();
  const deleteProjectMutation = useDeleteProjectMutation();

  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);
  const [isRenameProjectDialogOpen, setIsRenameProjectDialogOpen] = useState<boolean>(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  function handleProjectRename(project: ProjectResource, newName: string): void {
    updateProjectMutation.mutate(
      { ...project, spec: { display: { ...project.spec?.display, name: newName } } },
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

  function handleProjectDelete(name: string): void {
    deleteProjectMutation.mutate(
      { kind: 'Project', metadata: { name }, spec: {} },
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

  const hasAnyAction = !isReadonly && (canUpdate || canDelete);

  return (
    <Stack sx={{ width: '100%', overflowX: 'hidden' }} m={isMobileSize ? 1 : 2} mt={1.5} gap={2}>
      {/* Header: breadcrumbs + actions */}
      <Stack
        direction={isMobileSize ? 'column' : 'row'}
        alignItems={isMobileSize ? 'flex-start' : 'center'}
        justifyContent="space-between"
        gap={isMobileSize ? 1 : 0}
      >
        <ProjectBreadcrumbs project={project} />
        {hasAnyAction && (
          <>
            <Tooltip title="Project actions">
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                aria-label="Project actions"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                }}
              >
                <DotsVertical sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={menuAnchorEl}
              open={isMenuOpen}
              onClose={() => setMenuAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 180, mt: 0.5 } } }}
            >
              <MenuItem
                disabled={!canUpdate}
                onClick={() => {
                  setMenuAnchorEl(null);
                  setIsRenameProjectDialogOpen(true);
                }}
              >
                <ListItemIcon>
                  <PencilIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Rename project</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                disabled={!canDelete}
                onClick={() => {
                  setMenuAnchorEl(null);
                  setIsDeleteProjectDialogOpen(true);
                }}
                sx={{ color: 'error.main' }}
              >
                <ListItemIcon>
                  <DeleteOutline fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText>Delete project</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Stack>

      {/* Main content */}
      <ProjectTabs projectName={projectName} initialTab={tab} />

      {/* Dialogs */}
      <RenameResourceDialog
        resource={project}
        open={isRenameProjectDialogOpen}
        onSubmit={(name) => handleProjectRename(project, name)}
        onClose={() => setIsRenameProjectDialogOpen(false)}
      />
      <DeleteResourceDialog
        resource={project}
        open={isDeleteProjectDialogOpen}
        onSubmit={() => handleProjectDelete(projectName)}
        onClose={() => setIsDeleteProjectDialogOpen(false)}
      />
    </Stack>
  );
}

export default ProjectView;
