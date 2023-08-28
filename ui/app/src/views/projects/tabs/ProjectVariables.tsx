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
import { getVariableExtendedDisplayName, Variable, VariableResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { VariableList } from '../../../components/variable/VariableList';
import { CachedDatasourceAPI, HTTPDatasourceAPI } from '../../../model/datasource-api';
import { useDeleteVariableMutation, useUpdateVariableMutation, useVariableList } from '../../../model/variable-client';

interface ProjectVariablesProps {
  projectName: string;
  id?: string;
}

export function ProjectVariables(props: ProjectVariablesProps) {
  const { projectName, id } = props;
  const [datasourceApi] = useState(() => new CachedDatasourceAPI(new HTTPDatasourceAPI()));
  useEffect(() => {
    // warm up the caching of the datasources
    datasourceApi.listDatasources(projectName);
    datasourceApi.listGlobalDatasources();
  }, [datasourceApi, projectName]);

  const { data, isLoading } = useVariableList(projectName);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateVariableMutation = useUpdateVariableMutation(projectName);
  const deleteVariableMutation = useDeleteVariableMutation(projectName);

  const handleVariableUpdate = useCallback(
    (variable: VariableResource): Promise<void> =>
      new Promise((resolve, reject) => {
        updateVariableMutation.mutate(variable, {
          onSuccess: (updatedVariable: Variable) => {
            successSnackbar(
              `Global Variable ${getVariableExtendedDisplayName(updatedVariable)} has been successfully updated`
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
    (variable: VariableResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteVariableMutation.mutate(variable, {
          onSuccess: (deletedVariable: Variable) => {
            successSnackbar(
              `Global Variable ${getVariableExtendedDisplayName(deletedVariable)} has been successfully deleted`
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
