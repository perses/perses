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

import { getResourceExtendedDisplayName, Resource } from '@perses-dev/core';
import { Dispatch, DispatchWithoutAction, ReactElement } from 'react';
import { DeleteDialog } from './DeleteDialog';

interface DeleteResourceDialogProps<T extends Resource> {
  resource: T;
  open: boolean;
  onSubmit: Dispatch<T>;
  onClose: DispatchWithoutAction;
}

/**
 * Dialog used to delete a resource.
 * @param props.resource The resource to delete.
 * @param props.open Define if the dialog should be opened or not.
 * @param props.onSubmit Action to perform when user confirmed.
 * @param props.onClose Provides the function to close itself.
 */
export function DeleteResourceDialog<T extends Resource>(props: DeleteResourceDialogProps<T>): ReactElement {
  const { resource, open, onSubmit, onClose } = props;

  return (
    <DeleteDialog
      itemKind={resource.kind}
      itemName={resource.metadata.name}
      itemExtendedDisplayName={getResourceExtendedDisplayName(resource)}
      open={open}
      item={resource}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}
