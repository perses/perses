// Copyright The Perses Authors
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

import { Dispatch, DispatchWithoutAction, ReactElement } from 'react';
import { Dialog } from '@perses-dev/components';
import { Button } from '@mui/material';

interface DeleteDialogProps<T> {
  itemKind: string;
  itemName: string;
  itemExtendedDisplayName: string;
  open: boolean;
  item: T;
  onSubmit: Dispatch<T>;
  onClose: DispatchWithoutAction;
}

/**
 * Generic dialog used to build delete confirmation dialog for any kind of item.
 * @typeParam T The type of the item to delete.
 * @param itemKind The kind of the item to delete (e.g. Dashboard, Folder, etc.).
 * @param itemName The name of the item to delete.
 * @param itemExtendedDisplayName The extended display name of the item to delete (e.g. "Dashboard: my-dashboard").
 * @param item The item to delete.
 * @param open Define if the dialog should be opened or not.
 * @param onSubmit Action to perform when user confirmed.
 * @param onClose Provides the function to close itself.
 * @returns A React element representing the delete confirmation dialog.
 */
export function DeleteDialog<T>({
  itemKind,
  itemName,
  itemExtendedDisplayName,
  item,
  open,
  onSubmit,
  onClose,
}: DeleteDialogProps<T>): ReactElement {
  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>
        Delete {itemKind}: {itemName}
      </Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the {itemKind}: <strong>{itemExtendedDisplayName}</strong>? This action cannot
        be undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" onClick={() => onSubmit(item)}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
