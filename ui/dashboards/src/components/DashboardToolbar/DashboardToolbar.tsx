// Copyright 2022 The Perses Authors
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

import { Typography, Stack, Button, Box, useTheme, useMediaQuery } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import AddPanelGroupIcon from 'mdi-material-ui/PlusBoxOutline';
import AddPanelIcon from 'mdi-material-ui/ChartBoxPlusOutline';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
import { useDashboardActions, useEditMode } from '../../context';
import { TemplateVariableList } from '../Variables';
import { TimeRangeControls } from '../TimeRangeControls';
import { DownloadButton } from '../DownloadButton';

export interface DashboardToolbarProps {
  dashboardName: string;
  dashboardTitleComponent?: JSX.Element;
  initialVariableIsSticky?: boolean;
  onEditButtonClick: () => void;
  onCancelButtonClick: () => void;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const { dashboardName, dashboardTitleComponent, initialVariableIsSticky, onEditButtonClick, onCancelButtonClick } =
    props;

  const { isEditMode, setEditMode } = useEditMode();
  const { openAddPanelGroup, openAddPanel } = useDashboardActions();
  const isLaptopSize = useMediaQuery(useTheme().breakpoints.up('sm'));
  const dashboardTitle = dashboardTitleComponent ? (
    dashboardTitleComponent
  ) : (
    <Typography variant="h2">{dashboardName}</Typography>
  );

  const onSave = () => {
    setEditMode(false);
  };

  return (
    <>
      {isEditMode ? (
        <Stack spacing={2}>
          <Box sx={{ backgroundColor: (theme) => theme.palette.primary.light + '20' }}>
            <Box padding={2} display="flex">
              {dashboardTitle}
              <Stack direction="row" spacing={1} marginLeft="auto">
                <Button variant="contained" onClick={onSave}>
                  Save
                </Button>
                <Button variant="outlined" onClick={onCancelButtonClick}>
                  Cancel
                </Button>
              </Stack>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              alignItems: 'flex-start',
              padding: (theme) => theme.spacing(2),
            }}
          >
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <TemplateVariableList initialVariableIsSticky={initialVariableIsSticky} />
            </ErrorBoundary>
            <Stack direction="row" spacing={1} marginLeft="auto">
              <Button startIcon={<AddPanelGroupIcon />} onClick={openAddPanelGroup}>
                Add Panel Group
              </Button>
              <Button startIcon={<AddPanelIcon />} onClick={openAddPanel}>
                Add Panel
              </Button>
              <TimeRangeControls />
            </Stack>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1} padding={2}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            {dashboardTitle}
            <Stack direction="row" spacing={1} marginLeft="auto">
              <TimeRangeControls />
              <DownloadButton />
              {isLaptopSize && (
                <Button
                  variant="outlined"
                  startIcon={<PencilIcon />}
                  onClick={onEditButtonClick}
                  sx={{ marginLeft: 'auto' }}
                >
                  Edit
                </Button>
              )}
            </Stack>
          </Box>
          <Box paddingY={2}>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <TemplateVariableList initialVariableIsSticky={initialVariableIsSticky} />
            </ErrorBoundary>
          </Box>
        </Stack>
      )}
    </>
  );
};
