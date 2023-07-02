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

import { getVariableDisplayName, getVariableExtendedDisplayName, VariableResource } from '@perses-dev/core';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import React, { useCallback, useMemo, useState } from 'react';
import { GridActionsCellItem, GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { intlFormatDistance } from 'date-fns';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { DiscardChangesConfirmationDialog, useSnackbar } from '@perses-dev/components';
import Clipboard from 'mdi-material-ui/ClipboardOutline';
import { useIsReadonly } from '../../model/config-client';
import { DeleteVariableDialog } from '../dialogs';
import { useUpdateVariableMutation } from '../../model/project-client';
import { VariableDataGrid, Row } from './VariableDataGrid';
import { VariableFormDrawer } from './VariableFormDrawer';

export interface VariableListProperties {
  projectName: string;
  variableList: VariableResource[];
  hideToolbar?: boolean;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display variables in a table style.
 * @param props.variableList Contains all variables to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function ProjectVariableList(props: VariableListProperties) {
  const { projectName, variableList, hideToolbar, isLoading, initialState } = props;

  const isReadonly = useIsReadonly();
  const { infoSnackbar, successSnackbar, exceptionSnackbar } = useSnackbar();
  const updateVariableMutation = useUpdateVariableMutation(projectName);

  const getVariable = useCallback(
    (project: string, name: string) => {
      return variableList.find((variable) => variable.metadata.project === project && variable.metadata.name === name);
    },
    [variableList]
  );

  const rows = useMemo(() => {
    return variableList.map(
      (variable) =>
        ({
          project: variable.metadata.project,
          name: variable.metadata.name,
          displayName: getVariableDisplayName(variable),
          description: variable.spec.spec.display?.description,
          type: variable.spec.kind,
          version: variable.metadata.version,
          createdAt: variable.metadata.created_at,
          updatedAt: variable.metadata.updated_at,
        } as Row)
    );
  }, [variableList]);

  const [targetedVariable, setTargetedVariable] = useState<VariableResource>();
  const [isViewVariableFormStateOpened, setViewVariableFormStateOpened] = useState<boolean>(false);
  const [isEditVariableFormStateOpened, setEditVariableFormStateOpened] = useState<boolean>(false);
  const [isDeleteVariableDialogStateOpened, setDeleteVariableDialogStateOpened] = useState<boolean>(false);
  const [isDiscardDialogStateOpened, setDiscardDialogStateOpened] = useState<boolean>(false);

  const handleRowClick = useCallback(
    (project: string, name: string) => {
      setTargetedVariable(getVariable(project, name));
      setViewVariableFormStateOpened(true);
    },
    [getVariable]
  );

  const onRenameButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedVariable(getVariable(project, name));
      setEditVariableFormStateOpened(true);
    },
    [getVariable]
  );

  const onDeleteButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedVariable(getVariable(project, name));
      setDeleteVariableDialogStateOpened(true);
    },
    [getVariable]
  );

  const handleVariableUpdate = useCallback(
    (variable: VariableResource) => {
      updateVariableMutation.mutate(variable, {
        onSuccess: (updatedVariable: VariableResource) => {
          successSnackbar(`Variable ${getVariableExtendedDisplayName(updatedVariable)} have been successfully updated`);
          setEditVariableFormStateOpened(false);
        },
        onError: (err) => {
          exceptionSnackbar(err);
          throw err;
        },
      });
    },
    [exceptionSnackbar, successSnackbar, updateVariableMutation]
  );

  const handleVariableFormDiscard = () => {
    setDiscardDialogStateOpened(true);
  };

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
                onClick={async () => {
                  await navigator.clipboard.writeText(params.value);
                  infoSnackbar('Variable copied to clipboard!');
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
          <GridActionsCellItem
            key={params.id + '-edit'}
            icon={<PencilIcon />}
            label="Rename"
            disabled={isReadonly}
            onClick={onRenameButtonClick(params.row.project, params.row.name)}
          />,
          <GridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            disabled={isReadonly}
            onClick={onDeleteButtonClick(params.row.project, params.row.name)}
          />,
        ],
      },
    ],
    [infoSnackbar, isReadonly, onRenameButtonClick, onDeleteButtonClick]
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
          <VariableFormDrawer
            variable={targetedVariable}
            isOpen={isViewVariableFormStateOpened}
            onClose={() => setViewVariableFormStateOpened(false)}
            action="read"
          />
          <VariableFormDrawer
            variable={targetedVariable}
            isOpen={isEditVariableFormStateOpened}
            onChange={handleVariableUpdate}
            onClose={handleVariableFormDiscard}
            action="update"
          />
          <DeleteVariableDialog
            open={isDeleteVariableDialogStateOpened}
            onClose={() => setDeleteVariableDialogStateOpened(false)}
            variable={targetedVariable}
          />
          <DiscardChangesConfirmationDialog
            description="Are you sure you want to discard these changes? Changes cannot be recovered."
            isOpen={isDiscardDialogStateOpened}
            onCancel={() => setDiscardDialogStateOpened(false)}
            onDiscardChanges={() => {
              setDiscardDialogStateOpened(false);
              setEditVariableFormStateOpened(false);
            }}
          />
        </>
      )}
    </>
  );
}
