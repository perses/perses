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
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import { DashboardResource } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import ChevronDown from 'mdi-material-ui/ChevronDown';
import FolderPoundIcon from 'mdi-material-ui/FolderPound';
import DeleteOutline from 'mdi-material-ui/DeleteOutline';
import { Link as RouterLink } from 'react-router-dom';
import { KVSearch } from '@nexucis/kvsearch';
import FormatListBulletedIcon from 'mdi-material-ui/FormatListBulleted';
import { useDashboardList } from '../../model/dashboard-client';
import { DashboardList } from '../../components/DashboardList/DashboardList';
import { DeleteProjectDialog } from '../../components/DeleteProjectDialog/DeleteProjectDialog';
import { useIsReadonly } from '../../model/config-client';

interface ProjectRow {
  project: string;
  dashboards: DashboardResource[];
}

interface RenderDashboardListProps {
  projectRows: ProjectRow[];
}

function RenderDashboardList(props: RenderDashboardListProps) {
  const { projectRows } = props;
  const [openDeleteProjectDialog, setOpenDeleteProjectDialog] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<string>();
  const isReadonly = useIsReadonly();

  const openDeleteProjectConfirmDialog = ($event: MouseEvent, name: string) => {
    $event.stopPropagation(); // Preventing the accordion to toggle when we click on the button
    setProjectToDelete(name);
    setOpenDeleteProjectDialog(true);
  };

  const closeDeleteProjectConfirmDialog = () => {
    setOpenDeleteProjectDialog(false);
  };

  const accordions = useMemo(() => {
    return projectRows.map((row) => {
      const projectLink = `/projects/${row.project}`;

      return (
        <Accordion TransitionProps={{ unmountOnExit: true }} key={row.project}>
          <AccordionSummary expandIcon={<ChevronDown />}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
              <Stack direction="row" alignItems="center" gap={1}>
                <FolderPoundIcon />
                <Link component={RouterLink} to={projectLink} variant="h3" underline="hover">
                  {row.project}
                </Link>
              </Stack>
              <IconButton
                onClick={(event: MouseEvent) => openDeleteProjectConfirmDialog(event, row.project)}
                disabled={isReadonly}
              >
                <DeleteOutline />
              </IconButton>
            </Stack>
          </AccordionSummary>
          <AccordionDetails id={`${row.project}-dashboard-list`}>
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
            />
          </AccordionDetails>
        </Accordion>
      );
    });
  }, [isReadonly, projectRows]);

  if (projectRows.length === 0) {
    return (
      <Typography sx={{ fontStyle: 'italic', color: 'warning.main' }}>No projects with dashboards found!</Typography>
    );
  }

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

interface SearchableDashboardsProps {
  id?: string;
}

function buildProjectRow(list: DashboardResource[]) {
  const result: ProjectRow[] = [];
  for (const item of list) {
    const project = item.metadata.project;
    const row = result.find((row) => row.project === item.metadata.project);
    if (row) {
      row.dashboards.push(item);
    } else {
      result.push({ project: project, dashboards: [item] });
    }
  }
  return result;
}

export function SearchableDashboards(props: SearchableDashboardsProps) {
  const kvSearch = useMemo(
    () =>
      new KVSearch<DashboardResource>({
        indexedKeys: [
          ['metadata', 'project'], // Matching on the project name
          ['metadata', 'name'], // Matching on the dashboard name
          ['spec', 'display', 'name'], // Matching on the dashboard display name
        ],
      }),
    []
  );

  const { data, isLoading } = useDashboardList();
  const projectRows: ProjectRow[] = useMemo(() => {
    return buildProjectRow(data || []);
  }, [data]);

  const [search, setSearch] = useState<string>('');

  const filteredProjectRows: ProjectRow[] = useMemo(() => {
    if (search) {
      const result = kvSearch.filter(search, data || []);
      return buildProjectRow(result.map((res) => res.original));
    } else {
      return projectRows;
    }
  }, [kvSearch, projectRows, search, data]);

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
    <Stack gap={2} id={props.id}>
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

export function ProjectsAndDashboards() {
  return (
    <Stack my={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        <FormatListBulletedIcon />
        <h2>Projects & Dashboards</h2>
      </Stack>
      <SearchableDashboards id="project-dashboard-list" />
    </Stack>
  );
}
