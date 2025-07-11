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
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { useSnackbar } from '@perses-dev/components';
import { getResourceExtendedDisplayName, GlobalVariableResource, Variable } from '@perses-dev/core';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { VariableList } from '../../../components/variable/VariableList';
import {
  useCreateGlobalVariableMutation,
  useDeleteGlobalVariableMutation,
  useGlobalVariableList,
  useUpdateGlobalVariableMutation,
} from '../../../model/global-variable-client';

interface GlobalVariablesProps {
  id?: string;
}

export function GlobalVariables(props: GlobalVariablesProps): ReactElement {
  const { id } = props;
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi]);

  const { data, isLoading } = useGlobalVariableList();

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createVariableMutation = useCreateGlobalVariableMutation();
  const updateVariableMutation = useUpdateGlobalVariableMutation();
  const deleteVariableMutation = useDeleteGlobalVariableMutation();

  const handleVariableCreate = useCallback(
    (variable: GlobalVariableResource): Promise<void> =>
      new Promise((resolve, reject) => {
        createVariableMutation.mutate(variable, {
          onSuccess: (createdVariable: Variable) => {
            successSnackbar(
              `Global Variable ${getResourceExtendedDisplayName(createdVariable)} has been successfully created`
            );
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, createVariableMutation]
  );

  const handleVariableUpdate = useCallback(
    (variable: GlobalVariableResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateVariableMutation.mutate(variable, {
          onSuccess: (updatedVariable: Variable) => {
            successSnackbar(
              `Global Variable ${getResourceExtendedDisplayName(updatedVariable)} has been successfully updated`
            );
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, updateVariableMutation]
  );

  const handleVariableDelete = useCallback(
    (variable: GlobalVariableResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteVariableMutation.mutate(variable, {
          onSuccess: (deletedVariable: Variable) => {
            successSnackbar(
              `Global Variable ${getResourceExtendedDisplayName(deletedVariable)} has been successfully deleted`
            );
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteVariableMutation]
  );

  return (
    <Card id={id}>
      <VariableList
        data={data ?? []}
        isLoading={isLoading}
        onCreate={handleVariableCreate}
        onUpdate={handleVariableUpdate}
        onDelete={handleVariableDelete}
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
