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
import { useCallback, useEffect, useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { UserResource } from '@perses-dev/core';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { UserList } from '../../../components/users/UserList';
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useUserList,
  useUpdateUserMutation,
} from '../../../model/user-client';

interface UsersProps {
  id?: string;
}

export function Users(props: UsersProps) {
  const { id } = props;
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi]);

  const { data, isLoading } = useUserList();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const handleUserCreate = useCallback(
    (user: UserResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createUserMutation.mutate(user, {
          onSuccess: (createdUser: UserResource) => {
            successSnackbar(`Global User ${createdUser.metadata.name} has been successfully created`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, createUserMutation]
  );

  const handleUserUpdate = useCallback(
    (user: UserResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateUserMutation.mutate(user, {
          onSuccess: (updatedUser: UserResource) => {
            successSnackbar(`Global User ${updatedUser.metadata.name} has been successfully updated`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, updateUserMutation]
  );

  const handleUserDelete = useCallback(
    (user: UserResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteUserMutation.mutate(user, {
          onSuccess: (deletedUser: UserResource) => {
            successSnackbar(`Global User ${deletedUser.metadata.name} has been successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteUserMutation]
  );

  return (
    <Card id={id}>
      <UserList
        data={data ?? []}
        isLoading={isLoading}
        onCreate={handleUserCreate}
        onUpdate={handleUserUpdate}
        onDelete={handleUserDelete}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              version: false,
              createdAt: false,
              updatedAt: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'displayName', sort: 'asc' }],
          },
        }}
      />
    </Card>
  );
}
