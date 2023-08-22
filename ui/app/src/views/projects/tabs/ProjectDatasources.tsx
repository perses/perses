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
import { useSnackbar } from '@perses-dev/components';
import { useCallback } from 'react';
import { getDatasourceDisplayName, ProjectDatasource } from '@perses-dev/core';
import {
  useDatasourceList,
  useDeleteDatasourceMutation,
  useUpdateDatasourceMutation,
} from '../../../model/datasource-client';
import { DatasourceList } from '../../../components/DatasourceList/DatasourceList';

interface ProjectDatasourcesProps {
  projectName: string;
  hideToolbar?: boolean;
  id?: string;
}

export function ProjectDatasources(props: ProjectDatasourcesProps) {
  const { projectName, hideToolbar, id } = props;
  const { data, isLoading } = useDatasourceList(projectName);

  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const deleteDatasourceMutation = useDeleteDatasourceMutation(projectName);
  const updateDatasourceMutation = useUpdateDatasourceMutation(projectName);

  const handleDatasourceUpdate = useCallback(
    (datasource: ProjectDatasource): Promise<void> => {
      return new Promise((resolve, reject) => {
        updateDatasourceMutation.mutate(datasource, {
          onSuccess: (updatedDatasource: ProjectDatasource) => {
            successSnackbar(
              `Global Datasource ${getDatasourceDisplayName(updatedDatasource)} has been successfully updated`
            );
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      });
    },
    [exceptionSnackbar, successSnackbar, updateDatasourceMutation]
  );

  const handleDatasourceDelete = useCallback(
    (datasource: ProjectDatasource): Promise<void> => {
      return new Promise((resolve, reject) => {
        deleteDatasourceMutation.mutate(datasource, {
          onSuccess: (deletedDatasource: ProjectDatasource) => {
            successSnackbar(
              `Global Datasource ${getDatasourceDisplayName(deletedDatasource)} has been successfully deleted`
            );
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      });
    },
    [exceptionSnackbar, successSnackbar, deleteDatasourceMutation]
  );

  return (
    <Card id={id}>
      <DatasourceList
        data={data || []}
        hideToolbar={hideToolbar}
        onUpdate={handleDatasourceUpdate}
        onDelete={handleDatasourceDelete}
        isLoading={isLoading}
        initialState={{
          columns: {
            columnVisibilityModel: {
              project: false,
              version: false,
            },
          },
        }}
      />
    </Card>
  );
}
