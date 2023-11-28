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
import { Secret, SecretResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { SecretList } from '../../../components/secret/SecretList';
import { useDeleteSecretMutation, useUpdateSecretMutation, useSecretList } from '../../../model/secret-client';

interface ProjectSecretsProps {
  projectName: string;
  id?: string;
}

export function ProjectSecrets(props: ProjectSecretsProps) {
  const { projectName, id } = props;

  const { data, isLoading } = useSecretList(projectName);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateSecretMutation = useUpdateSecretMutation(projectName);
  const deleteSecretMutation = useDeleteSecretMutation(projectName);

  const handleSecretUpdate = useCallback(
    (secret: SecretResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateSecretMutation.mutate(secret, {
          onSuccess: (updatedSecret: Secret) => {
            successSnackbar(`Secret ${updatedSecret.metadata.name} has been successfully updated`);
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
    (secret: SecretResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteSecretMutation.mutate(secret, {
          onSuccess: (deletedSecret: Secret) => {
            successSnackbar(`Secret ${deletedSecret.metadata.name} has been successfully deleted`);
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
