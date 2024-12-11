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

import { Action, UserResource } from '@perses-dev/core';
import { Stack } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { DeleteResourceDialog } from '../dialogs';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import {
  CREATED_AT_COL_DEF,
  ListPropertiesWithCallbacks,
  NAME_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { UserDataGrid, Row } from './UserDataGrid';
import { UserDrawer } from './UserDrawer';

/**
 * Display users in a table style.
 * @param props.data Contains all users to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an 'update' action has been requested
 * @param props.onDelete Event received when a 'delete' action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function UserList(props: ListPropertiesWithCallbacks<UserResource>): ReactElement {
  const { data, hideToolbar, onCreate, onUpdate, onDelete, initialState, isLoading } = props;
  const isReadonly = useIsReadonly();

  const findUser = useCallback(
    (name: string) => {
      return data.find((user) => user.metadata.name === name);
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (user) =>
        ({
          name: user.metadata.name,
          nativeProvider: !!user.spec.nativeProvider?.password,
          oauthProviders: !!user.spec.oauthProviders?.length,
          version: user.metadata.version,
          createdAt: user.metadata.createdAt,
          updatedAt: user.metadata.updatedAt,
        }) as Row
    );
  }, [data]);

  const [targetedUser, setTargetedUser] = useState<UserResource>();
  const [action, setAction] = useState<Action>('read');
  const [isUserDrawerOpened, setUserDrawerOpened] = useState<boolean>(false);
  const [isDeleteUserDialogOpened, setDeleteUserDialogOpened] = useState<boolean>(false);

  const handleUserSave = useCallback(
    async (user: UserResource) => {
      if (action === 'create') {
        await onCreate(user);
      } else if (action === 'update') {
        await onUpdate(user);
      }
      setUserDrawerOpened(false);
    },
    [action, onCreate, onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string) => {
      setTargetedUser(findUser(name));
      setAction('read');
      setUserDrawerOpened(true);
    },
    [findUser]
  );

  const handleDuplicateButtonClick = useCallback(
    (name: string) => () => {
      const user = findUser(name);
      setTargetedUser(user);
      setAction('create');
      setUserDrawerOpened(true);
    },
    [findUser]
  );

  const handleEditButtonClick = useCallback(
    (name: string) => () => {
      const user = findUser(name);
      setTargetedUser(user);
      setAction('update');
      setUserDrawerOpened(true);
    },
    [findUser]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string) => () => {
      setTargetedUser(findUser(name));
      setDeleteUserDialogOpened(true);
    },
    [findUser]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      NAME_COL_DEF,
      {
        field: 'nativeProvider',
        headerName: 'Native Provider',
        type: 'boolean',
        flex: 3,
        minWidth: 150,
      },
      {
        field: 'oauthProviders',
        headerName: 'External Providers',
        type: 'boolean',
        flex: 3,
        minWidth: 150,
      },
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
            scope="User"
            project={GlobalProject}
            onClick={handleEditButtonClick(params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope="User"
            project={GlobalProject}
            onClick={handleDuplicateButtonClick(params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope="User"
            project={GlobalProject}
            onClick={handleDeleteButtonClick(params.row.name)}
          />,
        ],
      },
    ],
    [handleEditButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
  );

  return (
    <Stack width="100%">
      <UserDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
      {targetedUser && (
        <>
          <UserDrawer
            user={targetedUser}
            action={action}
            isOpen={isUserDrawerOpened}
            isReadonly={isReadonly}
            onActionChange={setAction}
            onSave={handleUserSave}
            onDelete={(v) => onDelete(v).then(() => setUserDrawerOpened(false))}
            onClose={() => setUserDrawerOpened(false)}
          />
          <DeleteResourceDialog
            open={isDeleteUserDialogOpened}
            resource={targetedUser}
            onClose={() => setDeleteUserDialogOpened(false)}
            onSubmit={(v) => onDelete(v).then(() => setDeleteUserDialogOpened(false))}
          />
        </>
      )}
    </Stack>
  );
}
