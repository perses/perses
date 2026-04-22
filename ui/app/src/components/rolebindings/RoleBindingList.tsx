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

import { getMetadataProject, RoleBinding, Action } from '@perses-dev/core';
import { Stack } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { useIsReadonly } from '../../context/Config';
import { subjectsSummary } from '../../utils/role';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { GlobalProject } from '../../context/Authorization';
import {
  CREATED_AT_COL_DEF,
  ListPropertiesWithCallbacks,
  NAME_COL_DEF,
  PROJECT_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { DeleteResourceDialog } from '../dialogs';
import { RoleBindingDataGrid, Row } from './RoleBindingDataGrid';
import { RoleBindingDrawer } from './RoleBindingDrawer';

/**
 * Display role bindings in a table style.
 * @param props.data Contains all role bindings to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an 'update' action has been requested
 * @param props.onDelete Event received when a 'delete' action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function RoleBindingList<T extends RoleBinding>(props: ListPropertiesWithCallbacks<T>): ReactElement {
  const { data, hideToolbar, onCreate, onUpdate, onDelete, initialState, isLoading } = props;
  const isReadonly = useIsReadonly();

  const findRoleBinding = useCallback(
    (name: string, project?: string) => {
      return data.find(
        (roleBinding) => getMetadataProject(roleBinding.metadata) === project && roleBinding.metadata.name === name
      );
    },
    [data]
  );

  const rows = useMemo(() => {
    return data.map(
      (roleBinding) =>
        ({
          project: getMetadataProject(roleBinding.metadata),
          name: roleBinding.metadata.name,
          subjects: subjectsSummary(roleBinding.spec.subjects, 5),
          version: roleBinding.metadata.version,
          createdAt: roleBinding.metadata.createdAt,
          updatedAt: roleBinding.metadata.updatedAt,
        }) as Row
    );
  }, [data]);

  const [targetedRoleBinding, setTargetedRoleBinding] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState<boolean>(false);
  const [isDeleteRoleBindingDialogOpened, setDeleteRoleBindingDialogOpened] = useState<boolean>(false);

  const handleRoleBindingSave = useCallback(
    async (roleBinding: T) => {
      if (action === 'create') {
        await onCreate(roleBinding);
      } else if (action === 'update') {
        await onUpdate(roleBinding);
      }
      setRoleBindingDrawerOpened(false);
    },
    [action, onCreate, onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedRoleBinding(findRoleBinding(name, project));
      setAction('read');
      setRoleBindingDrawerOpened(true);
    },
    [findRoleBinding]
  );

  const handleDuplicateButtonClick = useCallback(
    (name: string, project?: string) => (): void => {
      const roleBinding = findRoleBinding(name, project);
      setTargetedRoleBinding(roleBinding);
      setAction('create');
      setRoleBindingDrawerOpened(true);
    },
    [findRoleBinding]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => (): void => {
      const roleBinding = findRoleBinding(name, project);
      setTargetedRoleBinding(roleBinding);
      setAction('update');
      setRoleBindingDrawerOpened(true);
    },
    [findRoleBinding]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => (): void => {
      setTargetedRoleBinding(findRoleBinding(name, project));
      setDeleteRoleBindingDialogOpened(true);
    },
    [findRoleBinding]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      PROJECT_COL_DEF,
      NAME_COL_DEF,
      { field: 'subjects', headerName: 'Subjects', type: 'string', flex: 3, minWidth: 150 },
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
            scope={params.row.project ? 'RoleBinding' : 'GlobalRoleBinding'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope={params.row.project ? 'RoleBinding' : 'GlobalRoleBinding'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleDuplicateButtonClick(params.row.name, params.row.project)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope={params.row.project ? 'RoleBinding' : 'GlobalRoleBinding'}
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
      <RoleBindingDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
        onRowClick={handleRowClick}
      />
      {targetedRoleBinding && (
        <>
          <RoleBindingDrawer
            roleBinding={targetedRoleBinding}
            action={action}
            isOpen={isRoleBindingDrawerOpened}
            isReadonly={isReadonly}
            onActionChange={setAction}
            onSave={handleRoleBindingSave}
            onDelete={(v) => onDelete(v).then(() => setDeleteRoleBindingDialogOpened(false))}
            onClose={() => setRoleBindingDrawerOpened(false)}
          />
          <DeleteResourceDialog
            open={isDeleteRoleBindingDialogOpened}
            resource={targetedRoleBinding}
            onClose={() => setDeleteRoleBindingDialogOpened(false)}
            onSubmit={(v: T) => onDelete(v).then(() => setDeleteRoleBindingDialogOpened(false))}
          />
        </>
      )}
    </Stack>
  );
}
