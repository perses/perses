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

import { Typography, Stack, Button, Box } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import AddPanelGroupIcon from 'mdi-material-ui/PlusBoxOutline';
import AddPanelIcon from 'mdi-material-ui/ChartBoxPlusOutline';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
import { usePanelGroupDialog, useEditMode, usePanels } from '../context';
import { TemplateVariableList, TimeRangeControls } from '../components';

export interface DashboardToolbarProps {
  dashboardName: string;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const { dashboardName } = props;

  const { isEditMode, setEditMode } = useEditMode();
  const { openPanelGroupDialog } = usePanelGroupDialog();
  const { addPanel } = usePanels();

  const onEditButtonClick = () => {
    setEditMode(true);
  };

  const onCancelButtonClick = () => {
    setEditMode(false);
  };

  return (
    <>
      {isEditMode ? (
        <Stack spacing={2}>
          <Box sx={{ backgroundColor: (theme) => theme.palette.primary.light + '20' }}>
            <Box padding={2} display="flex">
              <Typography variant="h2">Edit {dashboardName}</Typography>
              <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
                <Button variant="contained">Save</Button>
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
              padding: (theme) => theme.spacing(2),
            }}
          >
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <TemplateVariableList />
            </ErrorBoundary>
            <Stack direction={'row'} spacing={1} sx={{ marginLeft: 'auto' }}>
              <Button startIcon={<AddPanelGroupIcon />} onClick={() => openPanelGroupDialog()}>
                Add Panel Group
              </Button>
              <Button startIcon={<AddPanelIcon />} onClick={() => addPanel()}>
                Add Panel
              </Button>
              <TimeRangeControls />
            </Stack>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={2} padding={2}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Typography variant="h2">{dashboardName}</Typography>
            <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
              <TimeRangeControls />
              <Button
                variant="outlined"
                startIcon={<PencilIcon />}
                onClick={onEditButtonClick}
                sx={{ marginLeft: 'auto' }}
              >
                Edit
              </Button>
            </Stack>
          </Box>
          <Box paddingY={2}>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <TemplateVariableList />
            </ErrorBoundary>
          </Box>
        </Stack>
      )}
    </>
  );
};
