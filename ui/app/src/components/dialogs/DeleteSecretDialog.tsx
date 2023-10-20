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

import { Secret } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction } from 'react';
import { Dialog } from '@perses-dev/components';
import { Button } from '@mui/material';

interface DeleteSecretDialogProps<T extends Secret> {
  secret: T;
  open: boolean;
  onSubmit: Dispatch<T>;
  onClose: DispatchWithoutAction;
}

/**
 * Dialog used to delete a secret.
 * @param props.secret The secret resource to delete.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onSubmit Action to perform when user confirmed.
 * @param props.onClose Provides the function to close itself.
 * @constructor
 */
export function DeleteSecretDialog<T extends Secret>(props: DeleteSecretDialogProps<T>) {
  const { secret, open, onClose, onSubmit } = props;

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header>Delete Secret</Dialog.Header>
      <Dialog.Content>
        Are you sure you want to delete the secret {secret.metadata.name}? This action cannot be undone.
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="contained" type="submit" onClick={() => onSubmit(secret)}>
          Delete
        </Button>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
