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

import { FolderResource, getResourceExtendedDisplayName } from '@perses-dev/core';
import { DispatchWithoutAction, ReactElement, useCallback, useMemo } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { withoutSubFolder, getSubFolderRef } from '../../utils/folderUtils';
import { useDeleteFolderMutation, useUpdateFolderMutation } from '../../model/folder-client';
import { DeleteDialog } from './DeleteDialog';

interface DeleteFolderDialogProps {
  folder: FolderResource;
  path: string[];
  open: boolean;
  onClose: DispatchWithoutAction;
}

/**
 * Dialog used to delete a folder or a subfolder.
 * @param folder The folder resource containing the subfolder to delete.
 * @param path The path of the subfolder to delete. If empty, the root folder will be deleted.
 * @param open Define if the dialog should be opened or not.
 * @param onSubmit Action to perform when user confirmed.
 * @param onClose Provides the function to close itself.
 * @returns A React element representing the delete folder dialog.
 */
export function DeleteFolderDialog({ folder, open, onClose, path }: DeleteFolderDialogProps): ReactElement {
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteFolderMutation = useDeleteFolderMutation();
  const updateFolderMutation = useUpdateFolderMutation();
  const { name, displayName, deleteRoot } = useMemo(() => {
    if (path.length === 0) {
      return {
        name: folder.metadata.name,
        displayName: getResourceExtendedDisplayName(folder),
        deleteRoot: true,
      };
    } else {
      const subFolder = getSubFolderRef(folder.spec, path);
      return {
        name: subFolder.name,
        displayName: subFolder.name,
        deleteRoot: false,
      };
    }
  }, [folder, path]);

  const onSuccess = useCallback(() => {
    successSnackbar(`Folder ${displayName} was successfully deleted`);
    onClose();
  }, [successSnackbar, displayName, onClose]);

  const onError = useCallback(
    (err: Error) => {
      exceptionSnackbar(err);
      throw err;
    },
    [exceptionSnackbar]
  );

  const handleFolderDelete = useCallback(() => {
    if (deleteRoot) {
      deleteFolderMutation.mutate(folder, {
        onSuccess: onSuccess,
        onError: onError,
      });
    } else {
      const specs = withoutSubFolder(folder.spec, path);
      updateFolderMutation.mutate(
        {
          spec: specs,
          metadata: folder.metadata,
          kind: 'Folder',
        },
        {
          onSuccess: onSuccess,
          onError: onError,
        }
      );
    }
  }, [deleteRoot, deleteFolderMutation, folder, onSuccess, onError, path, updateFolderMutation]);

  return (
    <DeleteDialog
      itemKind={folder.kind}
      itemName={name}
      itemExtendedDisplayName={displayName}
      open={open}
      item={folder}
      onSubmit={handleFolderDelete}
      onClose={onClose}
    />
  );
}
