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
import { ReactElement, useCallback } from 'react';
import { Role, RoleResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { RoleList } from '../../../components/roles/RoleList';
import {
  useDeleteRoleMutation,
  useUpdateRoleMutation,
  useRoleList,
  useCreateRoleMutation,
} from '../../../model/role-client';

interface ProjectRolesProps {
  projectName: string;
  id?: string;
}

export function ProjectRoles(props: ProjectRolesProps): ReactElement {
  const { projectName, id } = props;

  const { data, isLoading } = useRoleList(projectName);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createRoleMutation = useCreateRoleMutation(projectName);
  const updateRoleMutation = useUpdateRoleMutation(projectName);
  const deleteRoleMutation = useDeleteRoleMutation(projectName);

  const handleRoleCreate = useCallback(
    (role: RoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createRoleMutation.mutate(role, {
          onSuccess: (createdRole: Role) => {
            successSnackbar(`Role ${createdRole.metadata.name} has been successfully created`);
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

  const handleRoleUpdate = useCallback(
    (role: RoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateRoleMutation.mutate(role, {
          onSuccess: (updatedRole: Role) => {
            successSnackbar(`Role ${updatedRole.metadata.name} has been successfully updated`);
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

  const handleRoleDelete = useCallback(
    (role: RoleResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteRoleMutation.mutate(role, {
          onSuccess: (deletedRole: Role) => {
            successSnackbar(`Role ${deletedRole.metadata.name} has been successfully deleted`);
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
        onCreate={handleRoleCreate}
        onUpdate={handleRoleUpdate}
        onDelete={handleRoleDelete}
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
