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

import { FormEvent, useState } from 'react';
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  TextField,
  Stack,
  Box,
  DialogActions,
  Button,
  Select,
  SelectChangeEvent,
  MenuItem,
} from '@mui/material';
import { LayoutDefinition } from '@perses-dev/core';
import CloseIcon from 'mdi-material-ui/Close';
import { useDashboardApp, useLayouts } from '../../context';

const PanelGroupDialog = () => {
  const { layouts, updateLayout } = useLayouts();
  const { panelGroupDialog, closePanelGroupDialog } = useDashboardApp();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { groupIndex } = panelGroupDialog!; // PanelGroupDialog is only mounted if panelGroupDialog is defined

  const isEditingPanelGroup = groupIndex !== undefined;

  const [isCollapsed, setIsCollapsed] = useState(
    isEditingPanelGroup && !layouts[groupIndex]?.spec.display?.collapse?.open
  );
  const [name, setName] = useState(isEditingPanelGroup ? layouts[groupIndex]?.spec.display?.title : '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newLayout: LayoutDefinition = {
      kind: 'Grid',
      spec: {
        display: {
          title: name ?? '',
          collapse: {
            open: !isCollapsed,
          },
        },
        items: groupIndex === undefined ? [] : layouts[groupIndex]?.spec.items ?? [],
      },
    };
    updateLayout(newLayout, groupIndex);
    closePanelGroupDialog();
  };

  const handleSelectCollapsedStateChange = (e: SelectChangeEvent<string>) => {
    const isCollapsed = e.target.value === 'Close';
    setIsCollapsed(isCollapsed);
  };

  return (
    <Dialog open>
      <DialogTitle>Panel Group</DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={() => closePanelGroupDialog()}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ width: '500px' }}>
          <Stack spacing={2}>
            <FormControl>
              <TextField
                required
                label="Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <InputLabel>Collapse State</InputLabel>
              <Select
                required
                displayEmpty
                labelId="select-collapse-state"
                size="small"
                value={isCollapsed ? 'Close' : 'Open'}
                onChange={handleSelectCollapsedStateChange}
              >
                <MenuItem key={'open'} value={'Open'}>
                  Open
                </MenuItem>
                <MenuItem key={'close'} value={'Close'}>
                  Close
                </MenuItem>
              </Select>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit">
            {isEditingPanelGroup ? 'Apply' : 'Add'}
          </Button>
          <Button onClick={() => closePanelGroupDialog()}>Cancel</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PanelGroupDialog;
