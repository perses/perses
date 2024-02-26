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
import { RoleBinding, RoleBindingResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { RoleBindingList } from '../../../components/rolebindings/RoleBindingList';
import {
  useDeleteRoleBindingMutation,
  useUpdateRoleBindingMutation,
  useRoleBindingList,
  useCreateRoleBindingMutation,
} from '../../../model/rolebinding-client';

interface ProjectRoleBindingsProps {
  projectName: string;
  id?: string;
}

export function ProjectRoleBindings(props: ProjectRoleBindingsProps) {
  const { projectName, id } = props;

  const { data, isLoading } = useRoleBindingList(projectName);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createRoleBindingMutation = useCreateRoleBindingMutation(projectName);
  const updateRoleBindingMutation = useUpdateRoleBindingMutation(projectName);
  const deleteRoleBindingMutation = useDeleteRoleBindingMutation(projectName);

  const handleRoleBindingCreate = useCallback(
    (roleBinding: RoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (createdRoleBinding: RoleBinding) => {
            successSnackbar(`RoleBinding ${createdRoleBinding.metadata.name} has been successfully created`);
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

  const handleRoleBindingUpdate = useCallback(
    (roleBinding: RoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (updatedRoleBinding: RoleBinding) => {
            successSnackbar(`RoleBinding ${updatedRoleBinding.metadata.name} has been successfully updated`);
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

  const handleRoleBindingDelete = useCallback(
    (roleBinding: RoleBindingResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteRoleBindingMutation.mutate(roleBinding, {
          onSuccess: (deletedRoleBinding: RoleBinding) => {
            successSnackbar(`RoleBinding ${deletedRoleBinding.metadata.name} has been successfully deleted`);
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
        onCreate={handleRoleBindingCreate}
        onUpdate={handleRoleBindingUpdate}
        onDelete={handleRoleBindingDelete}
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
