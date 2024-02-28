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

import { Action, DispatchWithPromise, getMetadataProject, Secret } from '@perses-dev/core';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import React, { useCallback, useMemo, useState } from 'react';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { intlFormatDistance } from 'date-fns';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ClipboardIcon from 'mdi-material-ui/ClipboardOutline';
import { useSnackbar } from '@perses-dev/components';
import PencilIcon from 'mdi-material-ui/Pencil';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { DeleteSecretDialog } from '../dialogs';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { useIsReadonly } from '../../context/Config';
import { SecretDataGrid, Row } from './SecretDataGrid';
import { SecretDrawer } from './SecretDrawer';

export interface SecretListProperties<T extends Secret> {
  data: T[];
  hideToolbar?: boolean;
  onCreate: DispatchWithPromise<T>;
  onUpdate: DispatchWithPromise<T>;
  onDelete: DispatchWithPromise<T>;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display secrets in a table style.
 * @param props.data Contains all secrets to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an update action has been requested
 * @param props.onDelete Event received when a delete action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function SecretList<T extends Secret>({
  data,
  initialState,
  hideToolbar,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
}: SecretListProperties<T>) {
  const { infoSnackbar } = useSnackbar();
  const isReadonly = useIsReadonly();

  const findSecret = useCallback(
    (name: string, project?: string) => {
      return data.find((secret: T) => getMetadataProject(secret.metadata) === project && secret.metadata.name === name);
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (secret) =>
        ({
          project: getMetadataProject(secret.metadata),
          name: secret.metadata.name,
          basicAuth: !!secret.spec.basicAuth,
          authorization: !!secret.spec.authorization,
          tlsConfig: !!secret.spec.tlsConfig,
          version: secret.metadata.version,
          createdAt: secret.metadata.createdAt,
          updatedAt: secret.metadata.updatedAt,
        }) as Row
    );
  }, [data]);

  const [targetedSecret, setTargetedSecret] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isSecretDrawerOpened, setSecretDrawerOpened] = useState<boolean>(false);
  const [isDeleteSecretDialogOpened, setDeleteSecretDialogOpened] = useState<boolean>(false);

  const handleCopyNameButtonClick = useCallback(
    async (secretName: string) => {
      await navigator.clipboard.writeText(secretName);
      infoSnackbar('Secret copied to clipboard!');
    },
    [infoSnackbar]
  );

  const handleSecretSave = useCallback(
    async (secret: T) => {
      if (action === 'create') {
        await onCreate(secret);
      } else if (action === 'update') {
        await onUpdate(secret);
      }
      setSecretDrawerOpened(false);
    },
    [action, onCreate, onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedSecret(findSecret(name, project));
      setAction('read');
      setSecretDrawerOpened(true);
    },
    [findSecret]
  );

  const handleDuplicateButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const secret = findSecret(name, project);
      setTargetedSecret(secret);
      setAction('create');
      setSecretDrawerOpened(true);
    },
    [findSecret]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const secret = findSecret(name, project);
      setTargetedSecret(secret);
      setAction('update');
      setSecretDrawerOpened(true);
    },
    [findSecret]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => () => {
      setTargetedSecret(findSecret(name, project));
      setDeleteSecretDialogOpened(true);
    },
    [findSecret]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'name', headerName: 'Name', type: 'string', flex: 3, minWidth: 150 },
      {
        field: 'secret',
        headerName: 'Secret',
        type: 'string',
        flex: 3,
        minWidth: 150,
        valueGetter: (params: GridValueGetterParams) => params.row.name,
        renderCell: (params) => (
          <>
            <pre>{params.value}</pre>
            <Tooltip title="Copy secret to clipboard" placement="top">
              <IconButton
                onClick={async ($event) => {
                  $event.stopPropagation();
                  await handleCopyNameButtonClick(params.value);
                }}
                size="small"
              >
                <ClipboardIcon />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
      {
        field: 'basicAuth',
        headerName: 'Basic Auth',
        type: 'boolean',
        flex: 3,
        minWidth: 150,
      },
      { field: 'authorization', headerName: 'Authorization', type: 'boolean', flex: 3, minWidth: 150 },
      { field: 'tlsConfig', headerName: 'TLS Config', type: 'boolean', flex: 3, minWidth: 150 },
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
        minWidth: 150,
        getActions: (params: GridRowParams<Row>) => [
          <CRUDGridActionsCellItem
            key={params.id + '-edit'}
            icon={<PencilIcon />}
            label="Edit"
            action="update"
            scope={params.row.project ? 'Secret' : 'GlobalSecret'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope={params.row.project ? 'Secret' : 'GlobalSecret'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDuplicateButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope={params.row.project ? 'Secret' : 'GlobalSecret'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDeleteButtonClick(params.row.name, params.row.project)}
          />,
        ],
      },
    ],
    [handleCopyNameButtonClick, handleEditButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
  );

  return (
    <>
      <Stack width="100%">
        <SecretDataGrid
          columns={columns}
          rows={rows}
          initialState={initialState}
          hideToolbar={hideToolbar}
          isLoading={isLoading}
          onRowClick={handleRowClick}
        />
      </Stack>
      {targetedSecret && (
        <>
          <SecretDrawer
            secret={targetedSecret}
            isOpen={isSecretDrawerOpened}
            action={action}
            isReadonly={isReadonly}
            onSave={handleSecretSave}
            onDelete={(v) => onDelete(v).then(() => setDeleteSecretDialogOpened(false))}
            onClose={() => setSecretDrawerOpened(false)}
          />
          <DeleteSecretDialog
            open={isDeleteSecretDialogOpened}
            onClose={() => setDeleteSecretDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteSecretDialogOpened(false))}
            secret={targetedSecret}
          />
        </>
      )}
    </>
  );
}
