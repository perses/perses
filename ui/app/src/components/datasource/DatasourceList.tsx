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

import {
  getDatasourceDisplayName,
  getMetadataProject,
  Datasource,
  DispatchWithPromise,
  Action,
} from '@perses-dev/core';
import { Stack, Tooltip } from '@mui/material';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useIsReadonly } from '../../context/Config';
import { DeleteDatasourceDialog } from '../dialogs';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
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
          description: datasource.spec.display?.description,
          type: datasource.spec.plugin.kind,
          version: datasource.metadata.version,
          createdAt: datasource.metadata.createdAt,
          updatedAt: datasource.metadata.updatedAt,
        } as Row)
    );
  }, [data]);

  const [targetedDatasource, setTargetedDatasource] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isDatasourceDrawerOpened, setDatasourceDrawerOpened] = useState<boolean>(false);
  const [isDeleteDatasourceDialogOpened, setDeleteDatasourceDialogOpened] = useState<boolean>(false);

  const handleDatasourceUpdate = useCallback(
    async (datasource: T) => {
      await onUpdate(datasource);
      setDatasourceDrawerOpened(false);
    },
    [onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedDatasource(findDatasource(name, project));
      setAction('read');
      setDatasourceDrawerOpened(true);
    },
    [findDatasource]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const datasource = findDatasource(name, project);
      setTargetedDatasource(datasource);
      setAction('update');
      setDatasourceDrawerOpened(true);
    },
    [findDatasource]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => () => {
      setTargetedDatasource(findDatasource(name, project));
      setDeleteDatasourceDialogOpened(true);
    },
    [findDatasource]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'displayName', headerName: 'Display Name', type: 'string', flex: 3, minWidth: 150 },
      {
        field: 'name',
        headerName: 'Name',
        type: 'string',
        flex: 2,
        renderCell: (params) => <pre>{params.value}</pre>,
      },
      {
        field: 'version',
        headerName: 'Version',
        type: 'number',
        align: 'right',
        headerAlign: 'right',
        flex: 1,
        minWidth: 80,
      },
      { field: 'description', headerName: 'Description', type: 'string', flex: 3, minWidth: 300 },
      { field: 'type', headerName: 'Type', type: 'string', flex: 2 },
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
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.5,
        minWidth: 100,
        getActions: (params: GridRowParams<Row>) => [
          <CRUDGridActionsCellItem
            key={params.id + '-edit'}
            icon={<PencilIcon />}
            label="Rename"
            action="update"
            scope={params.row.project ? 'Datasource' : 'GlobalDatasource'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope={params.row.project ? 'Datasource' : 'GlobalDatasource'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDeleteButtonClick(params.row.name, params.row.project)}
          />,
        ],
      },
    ],
    [handleEditButtonClick, handleDeleteButtonClick]
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
        <>
          <DatasourceDrawer
            datasource={targetedDatasource}
            isOpen={isDatasourceDrawerOpened}
            action={action}
            isReadonly={isReadonly}
            onSave={handleDatasourceUpdate}
            onDelete={onDelete}
            onClose={() => setDatasourceDrawerOpened(false)}
          />
          <DeleteDatasourceDialog
            open={isDeleteDatasourceDialogOpened}
            onClose={() => setDeleteDatasourceDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteDatasourceDialogOpened(false))}
            datasource={targetedDatasource}
          />
        </>
      )}
    </Stack>
  );
}
