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

import { Action, getMetadataProject, Secret } from '@perses-dev/core';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { IconButton, Stack, Tooltip } from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ClipboardIcon from 'mdi-material-ui/ClipboardOutline';
import { useSnackbar } from '@perses-dev/components';
import PencilIcon from 'mdi-material-ui/Pencil';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { useIsReadonly } from '../../context/Config';
import {
  CREATED_AT_COL_DEF,
  ListPropertiesWithCallbacks,
  NAME_COL_DEF,
  PROJECT_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { DeleteResourceDialog } from '../dialogs';
import { SecretDataGrid, Row } from './SecretDataGrid';
import { SecretDrawer } from './SecretDrawer';

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
}: ListPropertiesWithCallbacks<T>): ReactElement {
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
          oauth: !!secret.spec.oauth,
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
    (name: string, project?: string) => (): void => {
      const secret = findSecret(name, project);
      setTargetedSecret(secret);
      setAction('create');
      setSecretDrawerOpened(true);
    },
    [findSecret]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => (): void => {
      const secret = findSecret(name, project);
      setTargetedSecret(secret);
      setAction('update');
      setSecretDrawerOpened(true);
    },
    [findSecret]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => (): void => {
      setTargetedSecret(findSecret(name, project));
      setDeleteSecretDialogOpened(true);
    },
    [findSecret]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      PROJECT_COL_DEF,
      NAME_COL_DEF,
      {
        field: 'secret',
        headerName: 'Secret',
        type: 'string',
        flex: 3,
        minWidth: 150,
        valueGetter: (_, row): string => row.name,
        renderCell: (params): ReactElement => (
          <>
            <span style={{ fontFamily: 'monospace' }}>{params.value}</span>
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
      { field: 'oauth', headerName: 'OAuth', type: 'boolean', flex: 3, minWidth: 150 },
      { field: 'tlsConfig', headerName: 'TLS Config', type: 'boolean', flex: 3, minWidth: 150 },
      VERSION_COL_DEF,
      CREATED_AT_COL_DEF,
      UPDATED_AT_COL_DEF,
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.5,
        minWidth: 150,
        getActions: (params: GridRowParams<Row>): ReactElement[] => [
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
            onActionChange={setAction}
            onSave={handleSecretSave}
            onDelete={(v) => onDelete(v).then(() => setDeleteSecretDialogOpened(false))}
            onClose={() => setSecretDrawerOpened(false)}
          />
          <DeleteResourceDialog
            open={isDeleteSecretDialogOpened}
            resource={targetedSecret}
            onClose={() => setDeleteSecretDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteSecretDialogOpened(false))}
          />
        </>
      )}
    </>
  );
}
