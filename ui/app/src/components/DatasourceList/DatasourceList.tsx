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

import { Datasource, getDatasourceDisplayName, getDatasourceExtendedDisplayName } from '@perses-dev/core';
import { Stack, Tooltip } from '@mui/material';
import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useSnackbar } from '@perses-dev/components';
import {
  useCreateDatasourceMutation,
  useDeleteDatasourceMutation,
  useUpdateDatasourceMutation,
} from '../../model/datasource-client';
import { DatasourceDataGrid, Row } from './DatasourceDataGrid';
import { DatasourceDrawer } from './DatasourceDrawer';

export interface DatasourceListProperties {
  projectName: string;
  datasourceList: Datasource[];
  hideToolbar?: boolean;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display datasources in a table style.
 * @param props.datasourceList Contains all datasources to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enableds
 */
export function DatasourceList(props: DatasourceListProperties) {
  const { projectName, datasourceList, hideToolbar, initialState, isLoading } = props;

  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const createDatasourceMutation = useCreateDatasourceMutation(projectName);
  const deleteDatasourceMutation = useDeleteDatasourceMutation(projectName);
  const updateDatasourceMutation = useUpdateDatasourceMutation(projectName);

  const getDatasource = useCallback(
    (project: string, name: string) => {
      return datasourceList.find(
        (datasource) => datasource.metadata.project === project && datasource.metadata.name === name
      );
    },
    [datasourceList]
  );

  const rows = useMemo(() => {
    return datasourceList.map(
      (datasource) =>
        ({
          project: datasource.metadata.project,
          name: datasource.metadata.name,
          displayName: getDatasourceDisplayName(datasource),
          version: datasource.metadata.version,
          createdAt: datasource.metadata.created_at,
          updatedAt: datasource.metadata.updated_at,
          type: datasource.spec.plugin.kind,
        } as Row)
    );
  }, [datasourceList]);

  const [targetedDatasource, setTargetedDatasource] = useState<Datasource>();
  const [isEditDatasourceFormStateOpened, setEditDatasourceFormStateOpened] = useState<boolean>(false);

  const handleDatasourceUpdate = useCallback(
    (datasource: Datasource) => {
      if (targetedDatasource != undefined && datasource.metadata.name != targetedDatasource.metadata.name) {
        // In this case "move" the datasource, aka create it with the new name & remove the former one
        // We do this because we can't just do a PUT call in that case (results in "document not found" error)
        // TODO: create + delete calls should be bundled together so that we avoid the case where only one would succeed
        createDatasourceMutation.mutate(datasource, {
          onSuccess: (createdDatasource: Datasource) => {
            successSnackbar(
              `Datasource ${getDatasourceExtendedDisplayName(createdDatasource)} has been successfully created`
            );
            setEditDatasourceFormStateOpened(false);
          },
          onError: (err) => {
            exceptionSnackbar(err);
            throw err;
          },
        });
        deleteDatasourceMutation.mutate(targetedDatasource, {
          onSuccess: (deletedDatasource: Datasource) => {
            successSnackbar(
              `Datasource ${getDatasourceExtendedDisplayName(deletedDatasource)} was successfully deleted`
            );
            setEditDatasourceFormStateOpened(false);
          },
          onError: (err) => {
            exceptionSnackbar(err);
            throw err;
          },
        });
      } else {
        updateDatasourceMutation.mutate(datasource, {
          onSuccess: (updatedDatasource: Datasource) => {
            successSnackbar(`Datasource ${getDatasourceDisplayName(updatedDatasource)} has been successfully updated`);
            setEditDatasourceFormStateOpened(false);
          },
          onError: (err) => {
            exceptionSnackbar(err);
            throw err;
          },
        });
      }
    },
    [
      exceptionSnackbar,
      successSnackbar,
      createDatasourceMutation,
      deleteDatasourceMutation,
      updateDatasourceMutation,
      targetedDatasource,
    ]
  );

  const onRowClick = useCallback(
    (project: string, name: string) => {
      setTargetedDatasource(getDatasource(project, name));
      setEditDatasourceFormStateOpened(true);
    },
    [getDatasource]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'type', headerName: 'Type', type: 'string', flex: 2 },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        flex: 2,
        renderCell: (params) => <pre>{params.value}</pre>,
      },
      { field: 'displayName', headerName: 'Display Name', type: 'string', flex: 3, minWidth: 150 },
      {
        field: 'version',
        headerName: 'Version',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 1,
        minWidth: 80,
      },
      {
        field: 'createdAt',
        headerName: 'Creation Date',
        type: 'dateTime',
        flex: 1,
        minWidth: 125,
        valueGetter: (params: GridValueGetterParams) => new Date(params.row.createdAt),
        renderCell: (params) => (
          <Tooltip title={params.value.toUTCString()} placement="top">
            <span>{intlFormatDistance(params.value, new Date())}</span>
          </Tooltip>
        ),
      },
      {
        field: 'updatedAt',
        headerName: 'Last Update',
        type: 'dateTime',
        flex: 1,
        minWidth: 125,
        valueGetter: (params: GridValueGetterParams) => new Date(params.row.updatedAt),
        renderCell: (params) => (
          <Tooltip title={params.value.toUTCString()} placement="top">
            <span>{intlFormatDistance(params.value, new Date())}</span>
          </Tooltip>
        ),
      },
    ],
    []
  );

  return (
    <Stack width="100%">
      <DatasourceDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        onRowClick={onRowClick}
      />
      {targetedDatasource && (
        <DatasourceDrawer
          datasource={targetedDatasource}
          isOpen={isEditDatasourceFormStateOpened}
          saveActionStr="Update"
          onSave={handleDatasourceUpdate}
          onClose={() => setEditDatasourceFormStateOpened(false)}
        />
      )}
    </Stack>
  );
}
