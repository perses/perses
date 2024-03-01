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

import { getMetadataProject, Role, Action } from '@perses-dev/core';
import { Stack } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { DeleteRoleDialog } from '../dialogs';
import { useIsReadonly } from '../../context/Config';
import { GlobalProject } from '../../context/Authorization';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import {
  CREATED_AT_COL_DEF,
  ListPropertiesWithCallbacks,
  NAME_COL_DEF,
  PROJECT_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { RoleDataGrid, Row } from './RoleDataGrid';
import { RoleDrawer } from './RoleDrawer';

/**
 * Display roles in a table style.
 * @param props.data Contains all roles to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an 'update' action has been requested
 * @param props.onDelete Event received when a 'delete' action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function RoleList<T extends Role>(props: ListPropertiesWithCallbacks<T>) {
  const { data, hideToolbar, onCreate, onUpdate, onDelete, initialState, isLoading } = props;
  const isReadonly = useIsReadonly();

  const findRole = useCallback(
    (name: string, project?: string) => {
      return data.find((role) => getMetadataProject(role.metadata) === project && role.metadata.name === name);
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (role) =>
        ({
          project: getMetadataProject(role.metadata),
          name: role.metadata.name,
          version: role.metadata.version,
          createdAt: role.metadata.createdAt,
          updatedAt: role.metadata.updatedAt,
        }) as Row
    );
  }, [data]);

  const [targetedRole, setTargetedRole] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isRoleDrawerOpened, setRoleDrawerOpened] = useState<boolean>(false);
  const [isDeleteRoleDialogOpened, setDeleteRoleDialogOpened] = useState<boolean>(false);

  const handleRoleSave = useCallback(
    async (role: T) => {
      if (action === 'create') {
        await onCreate(role);
      } else if (action === 'update') {
        await onUpdate(role);
      }
      setRoleDrawerOpened(false);
    },
    [action, onCreate, onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedRole(findRole(name, project));
      setAction('read');
      setRoleDrawerOpened(true);
    },
    [findRole]
  );

  const handleDuplicateButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const role = findRole(name, project);
      setTargetedRole(role);
      setAction('create');
      setRoleDrawerOpened(true);
    },
    [findRole]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const role = findRole(name, project);
      setTargetedRole(role);
      setAction('update');
      setRoleDrawerOpened(true);
    },
    [findRole]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => () => {
      setTargetedRole(findRole(name, project));
      setDeleteRoleDialogOpened(true);
    },
    [findRole]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      PROJECT_COL_DEF,
      NAME_COL_DEF,
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
            scope={params.row.project ? 'Role' : 'GlobalRole'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope={params.row.project ? 'Role' : 'GlobalRole'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDuplicateButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope={params.row.project ? 'Role' : 'GlobalRole'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDeleteButtonClick(params.row.name, params.row.project)}
          />,
        ],
      },
    ],
    [handleEditButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
  );

  return (
    <Stack width="100%">
      <RoleDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
      {targetedRole && (
        <>
          <RoleDrawer
            role={targetedRole}
            isOpen={isRoleDrawerOpened}
            action={action}
            isReadonly={isReadonly}
            onSave={handleRoleSave}
            onDelete={(v) => onDelete(v).then(() => setRoleDrawerOpened(false))}
            onClose={() => setRoleDrawerOpened(false)}
          />
          <DeleteRoleDialog
            open={isDeleteRoleDialogOpened}
            onClose={() => setDeleteRoleDialogOpened(false)}
            onSubmit={(v: T) => onDelete(v).then(() => setDeleteRoleDialogOpened(false))}
            role={targetedRole}
          />
        </>
      )}
    </Stack>
  );
}
