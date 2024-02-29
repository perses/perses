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

import { RoleBinding } from '@perses-dev/core';
import { Dispatch, useState } from 'react';
import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DeleteRoleBindingDialog } from '../dialogs';
import { DrawerProps } from '../drawer';
import { RoleBindingEditorForm } from './RoleBindingEditorForm';

interface RoleBindingDrawerProps<T extends RoleBinding> extends DrawerProps<T> {
  roleBinding: T;
  roleSuggestions?: string[];
}

export function RoleBindingDrawer<T extends RoleBinding>(props: RoleBindingDrawerProps<T>) {
  const { roleBinding, roleSuggestions, isOpen, action, isReadonly, onSave, onClose, onDelete } = props;
  const [isDeleteRoleBindingDialogStateOpened, setDeleteRoleBindingDialogStateOpened] = useState<boolean>(false);

  // Disables closing on click out. This is a quick-win solution to avoid losing draft changes.
  // -> TODO find a way to enable closing by clicking-out in edit view, with a discard confirmation modal popping up
  const handleClickOut = () => {
    /* do nothing */
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClickOut} data-testid="roleBinding-editor">
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isOpen && (
          <RoleBindingEditorForm
            initialRoleBinding={roleBinding}
            initialAction={action}
            roleSuggestions={roleSuggestions ?? []}
            isDraft={false}
            isReadonly={isReadonly}
            onSave={onSave as Dispatch<RoleBinding>}
            onClose={onClose}
            onDelete={onDelete ? () => setDeleteRoleBindingDialogStateOpened(true) : undefined}
          />
        )}
        {onDelete && (
          <DeleteRoleBindingDialog
            open={isDeleteRoleBindingDialogStateOpened}
            onClose={() => setDeleteRoleBindingDialogStateOpened(false)}
            onSubmit={(d: T) =>
              onDelete(d).then(() => {
                setDeleteRoleBindingDialogStateOpened(false);
                onClose();
              })
            }
            roleBinding={roleBinding}
          />
        )}
      </ErrorBoundary>
    </Drawer>
  );
}
