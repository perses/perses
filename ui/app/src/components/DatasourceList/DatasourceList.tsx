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

import { getDatasourceDisplayName, getMetadataProject, Datasource, DispatchWithPromise } from '@perses-dev/core';
import { Stack, Tooltip } from '@mui/material';
import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useIsReadonly } from '../../model/config-client';
import { DatasourceDataGrid, Row } from './DatasourceDataGrid';
import { DatasourceDrawer } from './DatasourceDrawer';

export interface DatasourceListProperties<T extends Datasource> {
  data: T[];
  hideToolbar?: boolean;
  onUpdate: DispatchWithPromise<T>;
  onDelete: DispatchWithPromise<T>;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display datasources in a table style.
 * @param props.data Contains all datasources to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an 'update' action has been requested
 * @param props.onDelete Event received when a 'delete' action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function DatasourceList<T extends Datasource>(props: DatasourceListProperties<T>) {
  const { data, hideToolbar, onUpdate, onDelete, initialState, isLoading } = props;
  const isReadonly = useIsReadonly();

  const findDatasource = useCallback(
    (name: string, project?: string) => {
      return data.find(
        (datasource) => getMetadataProject(datasource.metadata) === project && datasource.metadata.name === name
      );
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (datasource) =>
        ({
          project: getMetadataProject(datasource.metadata),
          name: datasource.metadata.name,
          displayName: getDatasourceDisplayName(datasource),
          version: datasource.metadata.version,
          createdAt: datasource.metadata.created_at,
          updatedAt: datasource.metadata.updated_at,
          type: datasource.spec.plugin.kind,
        } as Row)
    );
  }, [data]);

  const [targetedDatasource, setTargetedDatasource] = useState<T>();
  const [isEditDatasourceFormStateOpened, setEditDatasourceFormStateOpened] = useState<boolean>(false);

  const handleDatasourceUpdate = useCallback(
    async (datasource: T) => {
      await onUpdate(datasource);
      setEditDatasourceFormStateOpened(false);
    },
    [onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedDatasource(findDatasource(name, project));
      setEditDatasourceFormStateOpened(true);
    },
    [findDatasource]
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
        onRowClick={handleRowClick}
      />
      {targetedDatasource && (
        <DatasourceDrawer
          datasource={targetedDatasource}
          isOpen={isEditDatasourceFormStateOpened}
          action={isReadonly ? 'read' : 'update'}
          onSave={handleDatasourceUpdate}
          onDelete={onDelete}
          onClose={() => setEditDatasourceFormStateOpened(false)}
        />
      )}
    </Stack>
  );
}
