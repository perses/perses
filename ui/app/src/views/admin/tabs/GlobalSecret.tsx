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
import { GlobalSecretResource, Secret } from '@perses-dev/core';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { SecretList } from '../../../components/secrets/SecretList';
import {
  useCreateGlobalSecretMutation,
  useDeleteGlobalSecretMutation,
  useGlobalSecretList,
  useUpdateGlobalSecretMutation,
} from '../../../model/global-secret-client';

interface GlobalSecretsProps {
  id?: string;
}

export function GlobalSecrets(props: GlobalSecretsProps) {
  const { id } = props;
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi]);

  const { data, isLoading } = useGlobalSecretList();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createSecretMutation = useCreateGlobalSecretMutation();
  const updateSecretMutation = useUpdateGlobalSecretMutation();
  const deleteSecretMutation = useDeleteGlobalSecretMutation();

  const handleSecretCreate = useCallback(
    (secret: GlobalSecretResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createSecretMutation.mutate(secret, {
          onSuccess: (createdSecret: Secret) => {
            successSnackbar(`Global Secret ${createdSecret.metadata.name} has been successfully created`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, createSecretMutation]
  );

  const handleSecretUpdate = useCallback(
    (secret: GlobalSecretResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateSecretMutation.mutate(secret, {
          onSuccess: (updatedSecret: Secret) => {
            successSnackbar(`Global Secret ${updatedSecret.metadata.name} has been successfully updated`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, updateSecretMutation]
  );

  const handleSecretDelete = useCallback(
    (secret: GlobalSecretResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteSecretMutation.mutate(secret, {
          onSuccess: (deletedSecret: Secret) => {
            successSnackbar(`Global Secret ${deletedSecret.metadata.name} has been successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteSecretMutation]
  );

  return (
    <Card id={id}>
      <SecretList
        data={data ?? []}
        isLoading={isLoading}
        onCreate={handleSecretCreate}
        onUpdate={handleSecretUpdate}
        onDelete={handleSecretDelete}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false,
              project: false,
              name: false,
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
