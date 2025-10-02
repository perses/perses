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

import { FormEvent, ReactElement } from 'react';
import { Dialog } from '@perses-dev/components';
import { Button } from '@mui/material';
import { useDeletePanelGroupDialog, useViewPanel } from '../../context';

export const DeletePanelGroupDialog = (): ReactElement => {
  const { deletePanelGroupDialog, closeDeletePanelGroupDialog, deletePanelGroup } = useDeletePanelGroupDialog();
  const { setViewPanel } = useViewPanel();
  const panelGroupId = deletePanelGroupDialog?.panelGroupId;

  const handleDelete = (e: FormEvent): void => {
    e.preventDefault();
    if (panelGroupId === undefined) {
      throw new Error('group index is undefined');
    }
    deletePanelGroup(panelGroupId);
    closeDeletePanelGroupDialog();
    setViewPanel(undefined);
  };

  return (
    <Dialog open={deletePanelGroupDialog !== undefined}>
      <Dialog.Header>Delete Panel Group</Dialog.Header>

      <form onSubmit={handleDelete}>
        <Dialog.Content dividers sx={{ width: '500px' }}>
          Are you sure you want to delete {deletePanelGroupDialog?.panelGroupName ?? 'panel group'}? This will delete
          all the panels within the group.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="contained" type="submit">
            Delete
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => closeDeletePanelGroupDialog()}>
            Cancel
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog>
  );
};
