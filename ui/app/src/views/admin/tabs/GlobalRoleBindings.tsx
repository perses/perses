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

import { Card } from '@mui/material';
import { useCallback } from 'react';
import { GlobalRoleBindingResource, RoleBinding } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { RoleBindingList } from '../../../components/rolebindings/RoleBindingList';
import {
  useCreateGlobalRoleBindingMutation,
  useDeleteGlobalRoleBindingMutation,
  useGlobalRoleBindingList,
  useUpdateGlobalRoleBindingMutation,
} from '../../../model/global-rolebinding-client';

interface GlobalRoleBindingsProps {
  id?: string;
}

export function GlobalRoleBindings(props: GlobalRoleBindingsProps) {
  const { id } = props;

  const { data, isLoading } = useGlobalRoleBindingList();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createRoleBindingMutation = useCreateGlobalRoleBindingMutation();
  const updateRoleBindingMutation = useUpdateGlobalRoleBindingMutation();
  const deleteRoleBindingMutation = useDeleteGlobalRoleBindingMutation();

  const handleGlobalRoleBindingCreate = useCallback(
    (roleBinding: GlobalRoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (createdRoleBinding: RoleBinding) => {
            successSnackbar(`GlobalRoleBinding ${createdRoleBinding.metadata.name} has been successfully created`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, createRoleBindingMutation]
  );

  const handleGlobalRoleBindingUpdate = useCallback(
    (roleBinding: GlobalRoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (updatedRoleBinding: RoleBinding) => {
            successSnackbar(`GlobalRoleBinding ${updatedRoleBinding.metadata.name} has been successfully updated`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, updateRoleBindingMutation]
  );

  const handleGlobalRoleBindingDelete = useCallback(
    (roleBinding: GlobalRoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (deletedRoleBinding: RoleBinding) => {
            successSnackbar(`GlobalRoleBinding ${deletedRoleBinding.metadata.name} has been successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteRoleBindingMutation]
  );

  return (
    <Card id={id}>
      <RoleBindingList
        data={data ?? []}
        isLoading={isLoading}
        onCreate={handleGlobalRoleBindingCreate}
        onUpdate={handleGlobalRoleBindingUpdate}
        onDelete={handleGlobalRoleBindingDelete}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              project: false,
              version: false,
              createdAt: false,
              updatedAt: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'name', sort: 'asc' }],
          },
        }}
      />
    </Card>
  );
}
