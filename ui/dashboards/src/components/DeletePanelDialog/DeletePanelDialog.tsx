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

import { FormEvent } from 'react';
import { Dialog } from '@perses-dev/components';
import { useDeletePanelDialog, DeletePanelDialogState } from '../../context';

export const DeletePanelDialog = () => {
  const { deletePanelDialog, closeDeletePanelDialog } = useDeletePanelDialog();

  return (
    <Dialog open={deletePanelDialog !== undefined}>
      <Dialog.Header onClose={() => closeDeletePanelDialog()}>Delete Panel</Dialog.Header>
      {deletePanelDialog && <DeletePanelForm deletePanelDialog={deletePanelDialog} />}
    </Dialog>
  );
};

interface DeletePanelFormProps {
  deletePanelDialog: DeletePanelDialogState;
}

const DeletePanelForm = ({ deletePanelDialog }: DeletePanelFormProps) => {
  const { deletePanel, closeDeletePanelDialog } = useDeletePanelDialog();

  const handleDelete = (e: FormEvent) => {
    e.preventDefault();
    const { panelGroupItemId } = deletePanelDialog;
    deletePanel(panelGroupItemId);
    closeDeletePanelDialog();
  };
  return (
    <form onSubmit={handleDelete}>
      <Dialog.Content>
        Are you sure you want to delete {deletePanelDialog.panelName} from {deletePanelDialog.panelGroupName}? This
        action cannot be undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Dialog.PrimaryButton>Delete</Dialog.PrimaryButton>
        <Dialog.SecondaryButton onClick={() => closeDeletePanelDialog()}>Cancel</Dialog.SecondaryButton>
      </Dialog.Actions>
    </form>
  );
};
