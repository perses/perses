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
import { LayoutDefinition } from '@perses-dev/core';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import AddIcon from 'mdi-material-ui/Plus';
import { useEditMode, useLayouts } from '../context';
import { TimeRangeControls } from '../components';

export interface DashboardToolbarProps {
  dashboardName: string;
  onAddPanel: () => void;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
  const { dashboardName, onAddPanel } = props;

  const { isEditMode, setEditMode } = useEditMode();

  const onEditButtonClick = () => {
    setEditMode(true);
  };

  const onCancelButtonClick = () => {
    setEditMode(false);
  };

  const { addLayout } = useLayouts();

  const onAddGroup = () => {
    const newLayout: LayoutDefinition = {
      kind: 'Grid',
      spec: {
        display: {
          title: 'New Group',
          collapse: {
            open: true,
          },
        },
        items: [],
      },
    };
    addLayout(newLayout);
  };

  return (
    <Toolbar disableGutters sx={{ display: 'block', padding: (theme) => theme.spacing(2, 0) }}>
      {isEditMode ? (
        <>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <Typography variant="h2">Edit {dashboardName}</Typography>
            <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
              <TimeRangeControls />
              <Button variant="outlined" onClick={onCancelButtonClick}>
                Cancel
              </Button>
              <Button variant="contained">Save</Button>
            </Stack>
          </Box>
          <Stack
            direction={'row'}
            spacing={1}
            sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', padding: (theme) => theme.spacing(2, 0) }}
          >
            <Button startIcon={<AddIcon />} onClick={onAddGroup}>
              Add Group
            </Button>
            <Button startIcon={<AddIcon />} onClick={onAddPanel}>
              Add Panel
            </Button>
          </Stack>
        </>
      ) : (
        <Box sx={{ display: 'flex', width: '100%' }}>
          <Typography variant="h2">{dashboardName}</Typography>
          <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
            <TimeRangeControls />
            <Button
              variant="contained"
              startIcon={<PencilIcon />}
              onClick={onEditButtonClick}
              sx={{ marginLeft: 'auto' }}
            >
              Edit
            </Button>
          </Stack>
        </Box>
      )}
    </Toolbar>
  );
};
