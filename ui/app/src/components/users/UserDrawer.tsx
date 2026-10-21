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

import type { UserResource } from '@perses-dev/client';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import type { FormEditorHandle } from '@perses-dev/components';
import type { Dispatch, ReactElement } from 'react';
import { useRef, useState } from 'react';

import { DeleteResourceDialog } from '../dialogs';
import type { DrawerProps } from '../form-drawers';
import { UserEditorForm } from './UserEditorForm';

interface UserDrawerProps extends DrawerProps<UserResource> {
  user: UserResource;
}

export function UserDrawer({
  user,
  action,
  isOpen,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: UserDrawerProps): ReactElement {
  const [isDeleteUserDialogStateOpened, setDeleteUserDialogStateOpened] = useState<boolean>(false);

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
    <Drawer isOpen={isOpen} onClose={handleDrawerClose} data-testid="user-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <UserEditorForm
            ref={formRef}
            initialValue={user}
            action={action}
            isDraft={false}
            isReadonly={isReadonly}
            onActionChange={onActionChange}
            onSave={onSave as Dispatch<UserResource>}
            onClose={onClose}
            onDelete={onDelete ? (): void => setDeleteUserDialogStateOpened(true) : undefined}
          />
        )}
        {onDelete && (
          <DeleteResourceDialog
            open={isDeleteUserDialogStateOpened}
            resource={user}
            onClose={() => setDeleteUserDialogStateOpened(false)}
            onSubmit={(d: UserResource) =>
              onDelete(d).then(() => {
                setDeleteUserDialogStateOpened(false);
                onClose();
              })
            }
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
