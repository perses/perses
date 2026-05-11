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

import { Box, BoxProps, Stack, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import FileTreeOutlineIcon from 'mdi-material-ui/FileTreeOutline';
import ViewListOutlineIcon from 'mdi-material-ui/ViewListOutline';
import { ReactElement, useState } from 'react';
import { useDashboardList } from '../../../model/dashboard-client';
import { DashboardList } from '../../../components/DashboardList/DashboardList';
import { useIsEphemeralDashboardEnabled } from '../../../context/Config';
import { useFolderList } from '../../../model/folder-client';

interface ProjectDashboardsProps extends BoxProps {
  projectName: string;
  hideToolbar?: boolean;
}
export function ProjectDashboards({ projectName, hideToolbar, ...props }: ProjectDashboardsProps): ReactElement {
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');
  const { data, isLoading } = useDashboardList({ project: projectName });
  const { data: folderList, isLoading: isLoadingFolderList } = useFolderList({
    project: projectName,
    enabled: viewMode === 'tree',
  });
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();

  return (
    <Box {...props}>
      <Stack direction="row" justifyContent="flex-end">
        <ToggleButtonGroup
          size="small"
          exclusive
          value={viewMode}
          onChange={(_, newMode: 'flat' | 'tree' | null) => {
            if (newMode !== null) setViewMode(newMode);
          }}
          aria-label="dashboard view mode"
        >
          <ToggleButton value="flat" aria-label="flat view">
            <Tooltip title="Flat view">
              <ViewListOutlineIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="tree" aria-label="tree view">
            <Tooltip title="Tree view">
              <FileTreeOutlineIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <DashboardList
        dashboardList={data ?? []}
        folderList={folderList ?? []}
        hideToolbar={hideToolbar}
        isLoading={isLoading || (isLoadingFolderList && viewMode === 'tree')}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              project: false,
              version: false,
            },
          },
        }}
        isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        viewMode={viewMode}
      />
    </Box>
  );
}
