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

import { Typography, Stack, Button, Box, useTheme, useMediaQuery, Alert } from '@mui/material';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
import { OnSaveDashboard, useEditMode } from '../../context';
import { AddPanelButton } from '../AddPanelButton';
import { AddGroupButton } from '../AddGroupButton';
import { DownloadButton } from '../DownloadButton';
import { TimeRangeControls } from '../TimeRangeControls';
import { EditVariablesButton } from '../Variables';
import { EditButton } from '../EditButton';
import { EditJsonButton } from '../EditJsonButton';
import { SaveDashboardButton } from '../SaveDashboardButton';
import { DashboardStickyToolbar } from '../DashboardStickyToolbar';

export interface DashboardToolbarProps {
  dashboardName: string;
  dashboardTitleComponent?: JSX.Element;
  initialVariableIsSticky?: boolean;
  isReadonly: boolean;
  onEditButtonClick: () => void;
  onCancelButtonClick: () => void;
  onSave?: OnSaveDashboard;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const {
    dashboardName,
    dashboardTitleComponent,
    initialVariableIsSticky,
    isReadonly,
    onEditButtonClick,
    onCancelButtonClick,
    onSave,
  } = props;

  const { isEditMode } = useEditMode();

  const isBiggerThanMd = useMediaQuery(useTheme().breakpoints.up('md'));
  const isBiggerThanSm = useMediaQuery(useTheme().breakpoints.up('sm'));

  const dashboardTitle = dashboardTitleComponent ? (
    dashboardTitleComponent
  ) : (
    <Typography variant="h2">{dashboardName}</Typography>
  );

  const testId = 'dashboard-toolbar';

  return (
    <>
      {isEditMode ? (
        <Stack spacing={1} data-testid={testId}>
          <Box p={2} display="flex" sx={{ backgroundColor: (theme) => theme.palette.primary.main + '30' }}>
            {dashboardTitle}
            <Stack direction="row" spacing={1} marginLeft="auto">
              {isReadonly && (
                <Alert severity={'warning'} sx={{ backgroundColor: 'transparent', padding: 0 }}>
                  Dashboard managed via code only. Download JSON and commit changes to save.
                </Alert>
              )}
              <SaveDashboardButton onSave={onSave} isDisabled={isReadonly} />
              <Button variant="outlined" onClick={onCancelButtonClick}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'start',
              padding: (theme) => theme.spacing(1, 2, 2, 2),
            }}
          >
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <DashboardStickyToolbar
                initialVariableIsSticky={initialVariableIsSticky}
                sx={{
                  backgroundColor: ({ palette }) =>
                    palette.mode === 'dark' ? palette.background.default : palette.background.paper,
                }}
              />
            </ErrorBoundary>
            {isBiggerThanMd ? (
              // On bigger screens, make it one row
              <Stack direction="row" spacing={1} marginLeft="auto" sx={{ whiteSpace: 'nowrap' }}>
                <EditVariablesButton />
                <AddPanelButton />
                <AddGroupButton />
                <TimeRangeControls />
                <DownloadButton />
                <EditJsonButton />
              </Stack>
            ) : (
              // On smaller screens, make it two rows
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} marginLeft="auto" sx={{ whiteSpace: 'nowrap' }}>
                  <TimeRangeControls />
                  <DownloadButton />
                  <EditJsonButton />
                </Stack>
                <Stack direction="row" spacing={1} marginLeft="auto" sx={{ whiteSpace: 'nowrap' }}>
                  <EditVariablesButton />
                  <AddPanelButton />
                  <AddGroupButton />
                </Stack>
              </Stack>
            )}
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1} padding={2} data-testid={testId}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            {dashboardTitle}
            <Stack direction="row" spacing={1} marginLeft="auto">
              <TimeRangeControls />
              <DownloadButton />
              {isBiggerThanSm && <EditButton onClick={onEditButtonClick} />}
            </Stack>
          </Box>
          <Box paddingY={2}>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <DashboardStickyToolbar
                initialVariableIsSticky={initialVariableIsSticky}
                sx={{
                  backgroundColor: ({ palette }) =>
                    palette.mode === 'dark' ? palette.background.default : palette.background.paper,
                }}
              />
            </ErrorBoundary>
          </Box>
        </Stack>
      )}
    </>
  );
};
