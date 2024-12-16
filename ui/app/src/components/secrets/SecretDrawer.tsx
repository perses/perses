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
import { Dispatch, ReactElement, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DrawerProps } from '../form-drawers';
import { DeleteResourceDialog } from '../dialogs';
import { SecretEditorForm } from './SecretEditorForm';

interface SecretDrawerProps<T extends Secret> extends DrawerProps<T> {
  secret: T;
}

export function SecretDrawer<T extends Secret>({
  secret,
  action,
  isOpen,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: SecretDrawerProps<T>): ReactElement {
  const [isDeleteSecretDialogStateOpened, setDeleteSecretDialogStateOpened] = useState<boolean>(false);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = (): void => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="secret-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <SecretEditorForm
            initialValue={secret}
            action={action}
            isDraft={false}
            isReadonly={isReadonly}
            onActionChange={onActionChange}
            onSave={onSave as Dispatch<Secret>}
            onClose={onClose}
            onDelete={onDelete ? (): void => setDeleteSecretDialogStateOpened(true) : undefined}
          />
        )}
        {onDelete && (
          <DeleteResourceDialog
            open={isDeleteSecretDialogStateOpened}
            resource={secret}
            onClose={() => setDeleteSecretDialogStateOpened(false)}
            onSubmit={(d: T) =>
              onDelete(d).then(() => {
                setDeleteSecretDialogStateOpened(false);
                onClose();
              })
            }
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
