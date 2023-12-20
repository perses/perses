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

import { getMetadataProject, RoleBinding, DispatchWithPromise, Action } from '@perses-dev/core';
import { Stack, Tooltip } from '@mui/material';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import PencilIcon from 'mdi-material-ui/Pencil';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { DeleteRoleBindingDialog } from '../dialogs';
import { useIsReadonly } from '../../context/Config';
import { subjectsSummary } from '../../utils/role';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import { GlobalProject } from '../../context/Authorization';
import { RoleBindingDataGrid, Row } from './RoleBindingDataGrid';
import { RoleBindingDrawer } from './RoleBindingDrawer';

export interface RoleBindingListProperties<T extends RoleBinding> {
  data: T[];
  hideToolbar?: boolean;
  onUpdate: DispatchWithPromise<T>;
  onDelete: DispatchWithPromise<T>;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display role bindings in a table style.
 * @param props.data Contains all role bindings to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.onUpdate Event received when an 'update' action has been requested
 * @param props.onDelete Event received when a 'delete' action has been requested
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function RoleBindingList<T extends RoleBinding>(props: RoleBindingListProperties<T>) {
  const { data, hideToolbar, onUpdate, onDelete, initialState, isLoading } = props;
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
        } as Row)
    );
  }, [data]);

  const [targetedRoleBinding, setTargetedRoleBinding] = useState<T>();
  const [action, setAction] = useState<Action>('read');
  const [isRoleBindingDrawerOpened, setRoleBindingDrawerOpened] = useState<boolean>(false);
  const [isDeleteRoleBindingDialogOpened, setDeleteRoleBindingDialogOpened] = useState<boolean>(false);

  const handleRoleBindingUpdate = useCallback(
    async (roleBinding: T) => {
      await onUpdate(roleBinding);
      setRoleBindingDrawerOpened(false);
    },
    [onUpdate]
  );

  const handleRowClick = useCallback(
    (name: string, project?: string) => {
      setTargetedRoleBinding(findRoleBinding(name, project));
      setAction('read');
      setRoleBindingDrawerOpened(true);
    },
    [findRoleBinding]
  );

  const handleEditButtonClick = useCallback(
    (name: string, project?: string) => () => {
      const roleBinding = findRoleBinding(name, project);
      setTargetedRoleBinding(roleBinding);
      setAction('update');
      setRoleBindingDrawerOpened(true);
    },
    [findRoleBinding]
  );

  const handleDeleteButtonClick = useCallback(
    (name: string, project?: string) => () => {
      setTargetedRoleBinding(findRoleBinding(name, project));
      setDeleteRoleBindingDialogOpened(true);
    },
    [findRoleBinding]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'name', headerName: 'Name', type: 'string', flex: 3, minWidth: 150 },
      { field: 'subjects', headerName: 'Subjects', type: 'string', flex: 3, minWidth: 150 },
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
            scope={params.row.project ? 'RoleBinding' : 'GlobalRoleBinding'}
            project={params.row.project ? params.row.project : GlobalProject}
            onClick={handleEditButtonClick(params.row.name, params.row.project)}
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
    [handleEditButtonClick, handleDeleteButtonClick]
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
            isOpen={isRoleBindingDrawerOpened}
            action={action}
            isReadonly={isReadonly}
            onSave={(v: T) => handleRoleBindingUpdate(v).then(() => setRoleBindingDrawerOpened(false))}
            onDelete={onDelete}
            onClose={() => setRoleBindingDrawerOpened(false)}
          />
          <DeleteRoleBindingDialog
            open={isDeleteRoleBindingDialogOpened}
            onClose={() => setDeleteRoleBindingDialogOpened(false)}
            onSubmit={(v: T) => onDelete(v).then(() => setDeleteRoleBindingDialogOpened(false))}
            roleBinding={targetedRoleBinding}
          />
        </>
      )}
    </Stack>
  );
}
