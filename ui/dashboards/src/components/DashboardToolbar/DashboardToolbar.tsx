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
import { TimeRangeControls } from '@perses-dev/plugin-system';
import { ReactElement } from 'react';
import { OnSaveDashboard, useEditMode } from '../../context';
import { AddPanelButton } from '../AddPanelButton';
import { AddGroupButton } from '../AddGroupButton';
import { DownloadButton } from '../DownloadButton';
import { EditVariablesButton } from '../Variables';
import { EditDatasourcesButton } from '../Datasources';
import { EditButton } from '../EditButton';
import { EditJsonButton } from '../EditJsonButton';
import { SaveDashboardButton } from '../SaveDashboardButton';
import { DashboardStickyToolbar } from '../DashboardStickyToolbar';

export interface DashboardToolbarProps {
  dashboardName: string;
  dashboardTitleComponent?: JSX.Element;
  initialVariableIsSticky?: boolean;
  isReadonly: boolean;
  isVariableEnabled: boolean;
  isDatasourceEnabled: boolean;
  onEditButtonClick: () => void;
  onCancelButtonClick: () => void;
  onSave?: OnSaveDashboard;
  dashboardControlsComponent?: JSX.Element;
}

export const DashboardToolbar = (props: DashboardToolbarProps): ReactElement => {
  const {
    dashboardName,
    dashboardTitleComponent,
    initialVariableIsSticky,
    isReadonly,
    isVariableEnabled,
    isDatasourceEnabled,
    onEditButtonClick,
    onCancelButtonClick,
    onSave,
    dashboardControlsComponent,
  } = props;

  const { isEditMode } = useEditMode();

  const isBiggerThanSm = useMediaQuery(useTheme().breakpoints.up('sm'));
  const isBiggerThanMd = useMediaQuery(useTheme().breakpoints.up('md'));

  const dashboardTitle = dashboardTitleComponent ? (
    dashboardTitleComponent
  ) : (
    <Typography variant="h2">{dashboardName}</Typography>
  );

  const testId = 'dashboard-toolbar';

  return (
    <>
      <Stack data-testid={testId}>
        <Box
          px={2}
          py={1.5}
          display="flex"
          sx={{ backgroundColor: (theme) => theme.palette.primary.main + (isEditMode ? '30' : '0') }}
        >
          {dashboardTitle}
          {isEditMode ? (
            <Stack direction="row" gap={1} ml="auto">
              {isReadonly && (
                <Alert severity="warning" sx={{ backgroundColor: 'transparent', padding: 0 }}>
                  Dashboard managed via code only. Download JSON and commit changes to save.
                </Alert>
              )}
              <Stack direction="row" spacing={0.5} ml={1} whiteSpace="nowrap">
                {isVariableEnabled && <EditVariablesButton />}
                {isDatasourceEnabled && <EditDatasourcesButton />}
                <AddPanelButton />
                <AddGroupButton />
              </Stack>
              <SaveDashboardButton onSave={onSave} isDisabled={isReadonly} />
              <Button variant="outlined" onClick={onCancelButtonClick}>
                Cancel
              </Button>
            </Stack>
          ) : (
            <>
              {isBiggerThanSm && (
                <Stack direction="row" gap={1} ml="auto">
                  {dashboardControlsComponent}
                  <EditButton onClick={onEditButtonClick} />
                </Stack>
              )}
            </>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            width: '100%',
            alignItems: 'start',
            padding: (theme) => theme.spacing(1, 2, 0, 2),
            flexDirection: isBiggerThanMd ? 'row' : 'column',
            flexWrap: 'nowrap',
            gap: 1,
          }}
        >
          <Box width="100%">
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <DashboardStickyToolbar
                initialVariableIsSticky={initialVariableIsSticky}
                sx={{
                  backgroundColor: ({ palette }) => palette.background.default,
                }}
              />
            </ErrorBoundary>
          </Box>
          <Stack direction="row" ml="auto" flexWrap="wrap" justifyContent="end">
            <Stack direction="row" spacing={1} mt={1} ml={1}>
              <TimeRangeControls />
              <DownloadButton />
              <EditJsonButton isReadonly={!isEditMode} />
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </>
  );
};
