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

import { Dispatch, DispatchWithoutAction } from 'react';
import { Button } from '@mui/material';
import { Dialog } from '@perses-dev/components';
import { Datasource } from '@perses-dev/core';
import { getDatasourceExtendedDisplayName } from '@perses-dev/core/dist/utils/text';

export interface DeleteDatasourceDialogProps<T extends Datasource> {
  datasource: T;
  open: boolean;
  onSubmit: Dispatch<T>;
  onClose: DispatchWithoutAction;
}

/**
 * Dialog used to delete a datasource.
 * TODO: All delete dialogs are starting to be duplicates and can be probably merged into a single one.
 *  We´d just need to improve our tooling around dynamic text generation.
 * @param props.datasource The datasource resource to delete.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onSubmit Action to perform when user confirmed.
 * @param props.onClose Provides the function to close itself.
 * @constructor
 */
export function DeleteDatasourceDialog<T extends Datasource>(props: DeleteDatasourceDialogProps<T>) {
  const { datasource, open, onSubmit, onClose } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Datasource</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the datasource {getDatasourceExtendedDisplayName(datasource)}? This action
        cannot be undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" onClick={() => onSubmit(datasource)}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
