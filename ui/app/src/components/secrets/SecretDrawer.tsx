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

import type { Secret } from '@perses-dev/client';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import type { FormEditorHandle } from '@perses-dev/components';
import type { Dispatch, ReactElement } from 'react';
import { useRef, useState } from 'react';

import { DeleteResourceDialog } from '../dialogs';
import type { DrawerProps } from '../form-drawers';
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

  // Let the form handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const formRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = (): void => {
    if (formRef.current) {
      formRef.current.requestClose();
    } else {
      onClose();
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleDrawerClose} data-testid="secret-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <SecretEditorForm
            ref={formRef}
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
