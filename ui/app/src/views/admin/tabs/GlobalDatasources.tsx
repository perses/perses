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
import { getResourceDisplayName, GlobalDatasourceResource } from '@perses-dev/core';
import { useSnackbar } from '@perses-dev/components';
import { useCallback } from 'react';
import { DatasourceList } from '../../../components/datasource/DatasourceList';
import {
  useCreateGlobalDatasourceMutation,
  useDeleteGlobalDatasourceMutation,
  useGlobalDatasourceList,
  useUpdateGlobalDatasourceMutation,
} from '../../../model/admin-client';

interface GlobalDatasourcesProps {
  hideToolbar?: boolean;
  id?: string;
}

export function GlobalDatasources(props: GlobalDatasourcesProps) {
  const { hideToolbar, id } = props;
  const { data, isLoading } = useGlobalDatasourceList();
  const { successSnackbar, exceptionSnackbar } = useSnackbar();

  const createDatasourceMutation = useCreateGlobalDatasourceMutation();
  const deleteDatasourceMutation = useDeleteGlobalDatasourceMutation();
  const updateDatasourceMutation = useUpdateGlobalDatasourceMutation();

  const handleDatasourceCreate = useCallback(
    (datasource: GlobalDatasourceResource): Promise<void> => {
      return new Promise((resolve, reject) => {
        createDatasourceMutation.mutate(datasource, {
          onSuccess: (createdDatasource: GlobalDatasourceResource) => {
            successSnackbar(
              `Global Datasource ${getResourceDisplayName(createdDatasource)} has been successfully created`
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
    [exceptionSnackbar, successSnackbar, createDatasourceMutation]
  );

  const handleDatasourceUpdate = useCallback(
    (datasource: GlobalDatasourceResource): Promise<void> => {
      return new Promise((resolve, reject) => {
        updateDatasourceMutation.mutate(datasource, {
          onSuccess: (updatedDatasource: GlobalDatasourceResource) => {
            successSnackbar(
              `Global Datasource ${getResourceDisplayName(updatedDatasource)} has been successfully updated`
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
    (datasource: GlobalDatasourceResource): Promise<void> => {
      return new Promise((resolve, reject) => {
        deleteDatasourceMutation.mutate(datasource, {
          onSuccess: (deletedDatasource: GlobalDatasourceResource) => {
            successSnackbar(
              `Global Datasource ${getResourceDisplayName(deletedDatasource)} has been successfully deleted`
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
        onCreate={handleDatasourceCreate}
        onUpdate={handleDatasourceUpdate}
        onDelete={handleDatasourceDelete}
        isLoading={isLoading}
        initialState={{
          columns: {
            columnVisibilityModel: {
              project: false,
              version: false,
              createdAt: false,
              updatedAt: false,
            },
          },
        }}
      />
    </Card>
  );
}
