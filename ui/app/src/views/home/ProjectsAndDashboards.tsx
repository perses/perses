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

import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { ChangeEvent, ReactElement, useCallback, useMemo, useState } from 'react';
import { getResourceDisplayName } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import Archive from 'mdi-material-ui/Archive';
import Magnify from 'mdi-material-ui/Magnify';
import { Link as RouterLink } from 'react-router-dom';
import { KVSearch } from '@nexucis/kvsearch';
import ChevronRight from 'mdi-material-ui/ChevronRight';
import { ProjectWithDashboards, useProjectsWithDashboards } from '../../model/project-client';

/**
 * Generate a color for a project based on its name.
 * Uses a deterministic hash function to consistently assign colors to projects.
 * Note: Hardcoded colors are used here for decorative project avatars to ensure
 * distinct, visually appealing colors that work well for icons. This is an exception
 * to the general rule of using theme colors.
 */
function getProjectColor(projectName: string): string {
  const colors: string[] = [
    '#3B82F6',
    '#8B5CF6',
    '#10B981',
    '#F97316',
    '#EC4899',
    '#06B6D4',
    '#6366F1',
    '#F43F5E',
    '#14B8A6',
    '#F59E0B',
  ];
  let hash = 0;
  for (let i = 0; i < projectName.length; i++) {
    hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  // Index is guaranteed to be within bounds due to modulo operation
  const color = colors[index];
  if (color) {
    return color;
  }
  // Fallback to first color (should never happen, but satisfies TypeScript)
  return colors[0]!;
}

interface ProjectCardProps {
  row: ProjectWithDashboards;
}

function ProjectCard({ row }: ProjectCardProps): ReactElement {
  const theme = useTheme();
  const dashboardsCount = row.dashboards.length;
  const projectName = getResourceDisplayName(row.project);
  const projectColor = getProjectColor(row.project.metadata.name ?? 'default');

  return (
    <Paper
      elevation={1}
      component={RouterLink}
      to={`/projects/${row.project.metadata.name}`}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: (theme) => theme.shadows[2],
          bgcolor: 'action.hover',
        },
      }}
    >
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: projectColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Archive sx={{ color: theme.palette.common.white, fontSize: 20 }} />
        </Box>
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {projectName}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
        {dashboardsCount} dashboard{dashboardsCount !== 1 ? 's' : ''}
      </Typography>

      <Button
        fullWidth
        size="small"
        variant="text"
        endIcon={<ChevronRight fontSize="small" />}
        sx={{
          justifyContent: 'space-between',
          transition: 'all 0.2s',
          fontSize: '0.75rem',
          py: 0.5,
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          },
        }}
      >
        Open Project
      </Button>
    </Paper>
  );
}

interface RenderProjectGridProps {
  projectRows: ProjectWithDashboards[];
}

function RenderProjectGrid(props: RenderProjectGridProps): ReactElement {
  const { projectRows } = props;

  if (projectRows.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">No projects found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
          xl: 'repeat(5, 1fr)',
        },
        gap: 1.5,
      }}
    >
      {projectRows.map((row) => (
        <ProjectCard key={row.project.metadata.name} row={row} />
      ))}
    </Box>
  );
}

export function ProjectsAndDashboards(): ReactElement {
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

  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProjectRows: ProjectWithDashboards[] = useMemo(() => {
    if (searchQuery) {
      return kvSearch.filter(searchQuery, projectRows ?? []).map((res) => res.original);
    } else {
      return projectRows ?? [];
    }
  }, [kvSearch, projectRows, searchQuery]);

  const handleSearch = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  return (
    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Archive sx={{ color: 'primary.main' }} />
          <Typography variant="h2">Projects & Dashboards</Typography>
        </Box>

        <TextField
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearch}
          size="small"
          sx={{
            width: 280,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'action.hover',
              height: 36,
              '& fieldset': { border: 'none' },
              '& input': {
                padding: '8px 0',
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Magnify fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading ? (
        <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Stack>
      ) : (
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <RenderProjectGrid projectRows={filteredProjectRows} />
        </ErrorBoundary>
      )}
    </Box>
  );
}
