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

import { Secret, DispatchWithPromise, Action } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DeleteSecretDialog } from '../dialogs';
import { SecretEditorForm } from './SecretEditorForm';

interface SecretDrawerProps<T extends Secret> {
  secret: T;
  isOpen: boolean;
  action: Action;
  isReadonly?: boolean;
  onSave: Dispatch<T>;
  onDelete?: DispatchWithPromise<T>;
  onClose: DispatchWithoutAction;
}

export function SecretDrawer<T extends Secret>(props: SecretDrawerProps<T>) {
  const { secret, isOpen, action, isReadonly, onSave, onClose, onDelete } = props;
  const [isDeleteSecretDialogStateOpened, setDeleteSecretDialogStateOpened] = useState<boolean>(false);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="secret-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <SecretEditorForm
            initialSecret={secret}
            initialAction={action}
            isDraft={false}
            isReadonly={isReadonly}
            onSave={onSave as Dispatch<Secret>}
            onClose={onClose}
            onDelete={onDelete ? () => setDeleteSecretDialogStateOpened(true) : undefined}
          />
        )}
        {onDelete && (
          <DeleteSecretDialog
            open={isDeleteSecretDialogStateOpened}
            onClose={() => setDeleteSecretDialogStateOpened(false)}
            onSubmit={(d: T) =>
              onDelete(d).then(() => {
                setDeleteSecretDialogStateOpened(false);
                onClose();
              })
            }
            secret={secret}
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
