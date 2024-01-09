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

import { Action, DispatchWithPromise, getVariableDisplayName, getVariableProject, Variable } from '@perses-dev/core';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import React, { useCallback, useMemo, useState } from 'react';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { intlFormatDistance } from 'date-fns';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { useSnackbar } from '@perses-dev/components';
import Clipboard from 'mdi-material-ui/ClipboardOutline';
import { useIsReadonly } from '../../context/Config';
import { DeleteVariableDialog } from '../dialogs';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { VariableDataGrid, Row } from './VariableDataGrid';
import { VariableDrawer } from './VariableDrawer';

export interface VariableListProperties<T extends Variable> {
  data: T[];
  hideToolbar?: boolean;
  onUpdate: DispatchWithPromise<T>;
  onDelete: DispatchWithPromise<T>;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display variables in a table style.
 * @param props.data Contains all variables to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an update action has been requested
 * @param props.onDelete Event received when a delete action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function VariableList<T extends Variable>(props: VariableListProperties<T>) {
  const { data, hideToolbar, isLoading, initialState, onUpdate, onDelete } = props;
  const isReadonly = useIsReadonly();
  const { infoSnackbar } = useSnackbar();

  const findVariable = useCallback(
    (name: string, project?: string) => {
      return data.find((variable: T) => getVariableProject(variable) === project && variable.metadata.name === name);
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (variable) =>
        ({
          project: getVariableProject(variable),
          name: variable.metadata.name,
          displayName: getVariableDisplayName(variable),
          description: variable.spec.spec.display?.description,
          type: variable.spec.kind,
          version: variable.metadata.version,
          createdAt: variable.metadata.createdAt,
          updatedAt: variable.metadata.updatedAt,
        } as Row)
    );
  }, [data]);

  const [targetedVariable, setTargetedVariable] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState<boolean>(false);
  const [isDeleteVariableDialogOpened, setDeleteVariableDialogOpened] = useState<boolean>(false);

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedVariable(findVariable(name, project));
      setAction('read');
      setVariableDrawerOpened(true);
    },
    [findVariable]
  );

  const handleCopyVarNameButtonClick = useCallback(
    async (variableName: string) => {
      await navigator.clipboard.writeText(variableName);
      infoSnackbar('Variable copied to clipboard!');
    },
    [infoSnackbar]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const variable = findVariable(name, project);
      setTargetedVariable(variable);
      setAction('update');
      setVariableDrawerOpened(true);
    },
    [findVariable]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => () => {
      setTargetedVariable(findVariable(name, project));
      setDeleteVariableDialogOpened(true);
    },
    [findVariable]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'name', headerName: 'Name', type: 'string', flex: 3, minWidth: 150 },
      { field: 'displayName', headerName: 'Display Name', type: 'string', flex: 3, minWidth: 150 },
      {
        field: 'variable',
        headerName: 'Variable',
        type: 'string',
        flex: 3,
        minWidth: 150,
        valueGetter: (params: GridValueGetterParams) => `$${params.row.name}`,
        renderCell: (params) => (
          <>
            <pre>{params.value}</pre>
            <Tooltip title="Copy variable to clipboard" placement="top">
              <IconButton
                onClick={async ($event) => {
                  $event.stopPropagation();
                  await handleCopyVarNameButtonClick(params.value);
                }}
                size="small"
              >
                <Clipboard />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
      { field: 'description', headerName: 'Description', type: 'string', flex: 3, minWidth: 300 },
      { field: 'type', headerName: 'Type', type: 'string', flex: 3, minWidth: 150 },
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
            label="Edit"
            action="update"
            scope={params.row.project ? 'Variable' : 'GlobalVariable'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope={params.row.project ? 'Variable' : 'GlobalVariable'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDeleteButtonClick(params.row.name, params.row.project)}
          />,
        ],
      },
    ],
    [handleEditButtonClick, handleDeleteButtonClick, handleCopyVarNameButtonClick]
  );

  return (
    <>
      <Stack width="100%">
        <VariableDataGrid
          columns={columns}
          rows={rows}
          onRowClick={handleRowClick}
          initialState={initialState}
          hideToolbar={hideToolbar}
          isLoading={isLoading}
        ></VariableDataGrid>
      </Stack>
      {targetedVariable && (
        <>
          <VariableDrawer
            variable={targetedVariable}
            isOpen={isVariableDrawerOpened}
            action={action}
            isReadonly={isReadonly}
            onSave={(v: T) => onUpdate(v).then(() => setVariableDrawerOpened(false))}
            onDelete={onDelete}
            onClose={() => setVariableDrawerOpened(false)}
          />
          <DeleteVariableDialog
            open={isDeleteVariableDialogOpened}
            onClose={() => setDeleteVariableDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteVariableDialogOpened(false))}
            variable={targetedVariable}
          />
        </>
      )}
    </>
  );
}
