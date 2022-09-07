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

import { Toolbar, Typography, Stack, Button, Box } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import AddIcon from 'mdi-material-ui/Plus';
import { useEditMode } from '../context';
import { TimeRangeControls } from '../components';

export interface DashboardToolbarProps {
  dashboardName: string;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const { dashboardName } = props;

  const { isEditMode, setEditMode } = useEditMode();

  const onEditButtonClick = () => {
    setEditMode(true);
  };

  const onCancelButtonClick = () => {
    setEditMode(false);
  };

  return (
    <Toolbar disableGutters>
      {isEditMode ? (
        <Stack spacing={2} sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex' }}>
            <Typography variant="h2">Edit Dashboard</Typography>
            <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
              <TimeRangeControls />
              <Button variant="outlined" onClick={onCancelButtonClick}>
                Cancel
              </Button>
              <Button variant="contained">Save</Button>
            </Stack>
          </Box>
          <Button
            sx={{
              alignSelf: 'flex-end',
            }}
          >
            <AddIcon sx={{ marginRight: '8px' }} />
            Add Panel
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2} sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex' }}>
            <Typography variant="h2">{dashboardName}</Typography>
            <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
              <TimeRangeControls />
              <Button variant="contained" onClick={onEditButtonClick} sx={{ marginLeft: 'auto' }}>
                <PencilIcon sx={{ marginRight: '8px' }} />
                Edit
              </Button>
            </Stack>
          </Box>
        </Stack>
      )}
    </Toolbar>
  );
};
