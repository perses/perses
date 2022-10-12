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

import { FormEvent } from 'react';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from 'mdi-material-ui/Close';
import { usePanelGroupDialog, useLayouts } from '../../context';

const DeletePanelGroupDialog = () => {
  const { layouts, deletePanelGroup } = useLayouts();
  const { deletePanelGroupDialog, closeDeletePanelGroupDialog } = usePanelGroupDialog();

  const groupIndex = deletePanelGroupDialog?.groupIndex;

  const handleDelete = (e: FormEvent) => {
    e.preventDefault();
    if (groupIndex == undefined) {
      throw new Error('group index is undefined');
    }
    deletePanelGroup(groupIndex);
    closeDeletePanelGroupDialog();
  };

  return (
    <Dialog open={deletePanelGroupDialog !== undefined}>
      <DialogTitle>Delete Panel Group</DialogTitle>
      <IconButton
        aria-label="Close"
        onClick={() => closeDeletePanelGroupDialog()}
        sx={(theme) => ({
          position: 'absolute',
          top: theme.spacing(0.5),
          right: theme.spacing(0.5),
        })}
      >
        <CloseIcon />
      </IconButton>
      <form onSubmit={handleDelete}>
        <DialogContent sx={{ width: '500px' }}>
          {`Are you sure you want to delete ${
            groupIndex !== undefined && layouts[groupIndex] !== undefined ? layouts[groupIndex]?.title : 'panel group'
          }? This will delete all the panels within the group.`}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" type="submit">
            Delete
          </Button>
          <Button onClick={() => closeDeletePanelGroupDialog()}>Cancel</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DeletePanelGroupDialog;
