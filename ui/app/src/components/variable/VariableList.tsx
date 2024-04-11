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

import { Action, getResourceDisplayName, getVariableProject, Variable } from '@perses-dev/core';
import React, { useCallback, useMemo, useState } from 'react';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { IconButton, Stack, Tooltip } from '@mui/material';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { useSnackbar } from '@perses-dev/components';
import Clipboard from 'mdi-material-ui/ClipboardOutline';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import {
  CREATED_AT_COL_DEF,
  DESCRIPTION_COL_DEF,
  DISPLAY_NAME_COL_DEF,
  ListPropertiesWithCallbacks,
  NAME_COL_DEF,
  PROJECT_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { DeleteResourceDialog } from '../dialogs';
import { VariableDataGrid, Row } from './VariableDataGrid';
import { VariableDrawer } from './VariableDrawer';

/**
 * Display variables in a table style.
 * @param props.data Contains all variables to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an update action has been requested
 * @param props.onDelete Event received when a delete action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function VariableList<T extends Variable>(props: ListPropertiesWithCallbacks<T>) {
  const { data, hideToolbar, isLoading, initialState, onCreate, onUpdate, onDelete } = props;
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
          displayName: getResourceDisplayName(variable),
          description: variable.spec.spec.display?.description,
          type: variable.spec.kind,
          version: variable.metadata.version,
          createdAt: variable.metadata.createdAt,
          updatedAt: variable.metadata.updatedAt,
        }) as Row
    );
  }, [data]);

  const [targetedVariable, setTargetedVariable] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isVariableDrawerOpened, setVariableDrawerOpened] = useState<boolean>(false);
  const [isDeleteVariableDialogOpened, setDeleteVariableDialogOpened] = useState<boolean>(false);

  const handleVariableSave = useCallback(
    async (variable: T) => {
      if (action === 'create') {
        await onCreate(variable);
      } else if (action === 'update') {
        await onUpdate(variable);
      }
      setVariableDrawerOpened(false);
    },
    [action, onCreate, onUpdate]
  );

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

  const handleDuplicateButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const variable = findVariable(name, project);
      setTargetedVariable(variable);
      setAction('create');
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
      PROJECT_COL_DEF,
      NAME_COL_DEF,
      DISPLAY_NAME_COL_DEF,
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
      DESCRIPTION_COL_DEF,
      { field: 'type', headerName: 'Type', type: 'string', flex: 3, minWidth: 150 },
      VERSION_COL_DEF,
      CREATED_AT_COL_DEF,
      UPDATED_AT_COL_DEF,
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.5,
        minWidth: 150,
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
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope={params.row.project ? 'Variable' : 'GlobalVariable'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDuplicateButtonClick(params.row.name, params.row.project)}
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
    [handleCopyVarNameButtonClick, handleEditButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
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
            onSave={handleVariableSave}
            onDelete={(v) => onDelete(v).then(() => setDeleteVariableDialogOpened(false))}
            onClose={() => setVariableDrawerOpened(false)}
          />
          <DeleteResourceDialog
            open={isDeleteVariableDialogOpened}
            resource={targetedVariable}
            onClose={() => setDeleteVariableDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteVariableDialogOpened(false))}
          />
        </>
      )}
    </>
  );
}
