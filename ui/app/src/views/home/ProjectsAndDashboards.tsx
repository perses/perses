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
  CircularProgress,
  IconButton,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ChangeEvent, MouseEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { getResourceDisplayName, ProjectResource } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary, useSnackbar } from '@perses-dev/components';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import Archive from 'mdi-material-ui/Archive';
import DeleteOutline from 'mdi-material-ui/DeleteOutline';
import { Link as RouterLink } from 'react-router-dom';
import { KVSearch } from '@nexucis/kvsearch';
import FormatListBulletedIcon from 'mdi-material-ui/FormatListBulleted';
import { DashboardList } from '../../components/DashboardList/DashboardList';
import { useIsEphemeralDashboardEnabled, useIsReadonly } from '../../context/Config';
import { useHasPermission } from '../../context/Authorization';
import { DeleteResourceDialog } from '../../components/dialogs';
import { ProjectWithDashboards, useProjectsWithDashboards, useDeleteProjectMutation } from '../../model/project-client';

interface ProjectAccordionProps {
  row: ProjectWithDashboards;
}

function ProjectAccordion({ row }: ProjectAccordionProps): ReactElement {
  const isReadonly = useIsReadonly();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const [isDeleteProjectDialogOpen, setIsDeleteProjectDialogOpen] = useState<boolean>(false);

  const hasPermission = useHasPermission('delete', row.project.metadata.name, 'Project');
  const deleteProjectMutation = useDeleteProjectMutation();

  function openDeleteProjectConfirmDialog($event: MouseEvent): void {
    $event.stopPropagation(); // Preventing the accordion to toggle when we click on the button
    setIsDeleteProjectDialogOpen(true);
  }

  function closeDeleteProjectConfirmDialog(): void {
    setIsDeleteProjectDialogOpen(false);
  }

  function handleProjectDelete(project: ProjectResource): void {
    deleteProjectMutation.mutate(project, {
      onSuccess: (deletedProject: ProjectResource): void => {
        successSnackbar(`Project ${deletedProject.metadata.name} has been successfully deleted`);
        closeDeleteProjectConfirmDialog();
      },
      onError: (err) => {
        exceptionSnackbar(err);
        throw err;
      },
    });
  }

  return (
    <>
      <Accordion TransitionProps={{ unmountOnExit: true }} key={row.project.metadata.name}>
        <AccordionSummary expandIcon={<ChevronDown />}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
            <Stack direction="row" alignItems="center" gap={1}>
              <Archive sx={{ margin: 1 }} />
              <Link component={RouterLink} to={`/projects/${row.project.metadata.name}`} variant="h3" underline="hover">
                {getResourceDisplayName(row.project)}
              </Link>
            </Stack>
            {hasPermission && (
              <IconButton onClick={(event: MouseEvent) => openDeleteProjectConfirmDialog(event)} disabled={isReadonly}>
                <DeleteOutline />
              </IconButton>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails id={`${row.project.metadata.name}-dashboard-list`} sx={{ padding: 0 }}>
          <DashboardList
            dashboardList={row.dashboards}
            hideToolbar={true}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25, page: 0 },
              },
              columns: {
                columnVisibilityModel: {
                  id: false,
                  project: false,
                  version: false,
                },
              },
            }}
            isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
          />
        </AccordionDetails>
      </Accordion>
      <DeleteResourceDialog
        resource={row.project}
        open={isDeleteProjectDialogOpen}
        onSubmit={() => handleProjectDelete(row.project)}
        onClose={closeDeleteProjectConfirmDialog}
      />
    </>
  );
}

interface RenderDashboardListProps {
  projectRows: ProjectWithDashboards[];
}

function RenderDashboardList(props: RenderDashboardListProps): ReactElement {
  const { projectRows } = props;

  if (projectRows.length === 0) {
    return (
      <Typography sx={{ fontStyle: 'italic', color: 'warning.main' }}>No projects with dashboards found!</Typography>
    );
  }

  return (
    <Box>
      {projectRows.map((row) => (
        <ProjectAccordion key={row.project.metadata.name} row={row} />
      ))}
    </Box>
  );
}

interface SearchableDashboardsProps {
  id?: string;
}

export function SearchableDashboards(props: SearchableDashboardsProps): ReactElement {
  const kvSearch = useMemo(
    () =>
      new KVSearch<ProjectWithDashboards>({
        indexedKeys: [
          ['dashboards', 'metadata', 'project'], // Matching on the dashboard project name
          ['dashboards', 'metadata', 'name'], // Matching on the dashboard name
          ['dashboards', 'spec', 'display', 'name'], // Matching on the dashboard display name
          ['project', 'metadata', 'name'], // Matching on the project name
          ['project', 'metadata', 'display', 'name'], // Matching on the project display name
        ],
      }),
    []
  );

  const { data: projectRows, isLoading } = useProjectsWithDashboards();

  const [search, setSearch] = useState<string>('');

  const filteredProjectRows: ProjectWithDashboards[] = useMemo(() => {
    if (search) {
      return kvSearch.filter(search, projectRows ?? []).map((res) => res.original);
    } else {
      return projectRows ?? [];
    }
  }, [kvSearch, projectRows, search]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSearch(e.target.value);
    } else {
      setSearch('');
    }
  }, []);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack gap={2} id={props.id} marginBottom={4}>
      <TextField
        id="search"
        label="Search a Project or a Dashboard"
        variant="outlined"
        onChange={handleSearch}
        fullWidth
      />
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <RenderDashboardList projectRows={filteredProjectRows} />
      </ErrorBoundary>
    </Stack>
  );
}

export function ProjectsAndDashboards(): ReactElement {
  return (
    <Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <FormatListBulletedIcon />
        <h2>Projects & Dashboards</h2>
      </Stack>
      <SearchableDashboards id="project-dashboard-list" />
    </Stack>
  );
}
