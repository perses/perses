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

import { Dispatch, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DeleteResourceDialog } from '../dialogs';
import { DrawerProps } from '../drawer';
import { UserResource } from '../../model/user-client';
import { UserEditorForm } from './UserEditorForm';

interface UserDrawerProps extends DrawerProps<UserResource> {
  user: UserResource;
}

export function UserDrawer(props: UserDrawerProps) {
  const { user, isOpen, action, isReadonly, onSave, onClose, onDelete } = props;
  const [isDeleteUserDialogStateOpened, setDeleteUserDialogStateOpened] = useState<boolean>(false);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="user-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <UserEditorForm
            initialUser={user}
            initialAction={action}
            isDraft={false}
            isReadonly={isReadonly}
            onSave={onSave as Dispatch<UserResource>}
            onClose={onClose}
            onDelete={onDelete ? () => setDeleteUserDialogStateOpened(true) : undefined}
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
