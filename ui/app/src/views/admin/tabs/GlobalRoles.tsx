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
import { GlobalRoleResource, Role } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { RoleList } from '../../../components/roles/RoleList';
import {
  useCreateGlobalRoleMutation,
  useDeleteGlobalRoleMutation,
  useGlobalRoleList,
  useUpdateGlobalRoleMutation,
} from '../../../model/global-role-client';

interface GlobalRolesProps {
  id?: string;
}

export function GlobalRoles(props: GlobalRolesProps) {
  const { id } = props;

  const { data, isLoading } = useGlobalRoleList();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createRoleMutation = useCreateGlobalRoleMutation();
  const updateRoleMutation = useUpdateGlobalRoleMutation();
  const deleteRoleMutation = useDeleteGlobalRoleMutation();

  const handleGlobalRoleCreate = useCallback(
    (role: GlobalRoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createRoleMutation.mutate(role, {
          onSuccess: (createdRole: Role) => {
            successSnackbar(`GlobalRole ${createdRole.metadata.name} has been successfully created`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, createRoleMutation]
  );

  const handleGlobalRoleUpdate = useCallback(
    (role: GlobalRoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateRoleMutation.mutate(role, {
          onSuccess: (updatedRole: Role) => {
            successSnackbar(`GlobalRole ${updatedRole.metadata.name} has been successfully updated`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, updateRoleMutation]
  );

  const handleGlobalRoleDelete = useCallback(
    (role: GlobalRoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteRoleMutation.mutate(role, {
          onSuccess: (deletedRole: Role) => {
            successSnackbar(`GlobalRole ${deletedRole.metadata.name} has been successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteRoleMutation]
  );

  return (
    <Card id={id}>
      <RoleList
        data={data ?? []}
        isLoading={isLoading}
        onCreate={handleGlobalRoleCreate}
        onUpdate={handleGlobalRoleUpdate}
        onDelete={handleGlobalRoleDelete}
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
