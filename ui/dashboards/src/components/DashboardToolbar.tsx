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

export const DashboardToolbar = ({ onSave }) => {
  const { isEditMode, setEditMode } = useEditMode();

  const onEditButtonClick = () => {
    setEditMode(true);
  };

  const onCancelButtonClick = () => {
    setEditMode(false);
  };

  const onSaveButtonClick = () => {
    // Need to be able to pull the entire dashboard resource from context
    onSave();
  };

  return (
    <Toolbar disableGutters>
      {isEditMode ? (
        <Stack spacing={2} sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex' }}>
            <Typography variant="h6">Edit Dashboard</Typography>
            <Stack direction="row" spacing={1} sx={{ marginLeft: 'auto' }}>
              <Button variant="outlined" onClick={onCancelButtonClick}>
                Cancel
              </Button>
              <Button variant="contained" onClick={onSaveButtonClick}>
                Save
              </Button>
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
        <Button variant="contained" onClick={onEditButtonClick} sx={{ marginLeft: 'auto' }}>
          <PencilIcon sx={{ marginRight: '8px' }} />
          Edit
        </Button>
      )}
    </Toolbar>
  );
};
