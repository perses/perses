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

import { dashboardDisplayName, DashboardResource } from '@perses-dev/core';
import { Box, Stack, Tooltip } from '@mui/material';
import { GridColDef, GridActionsCellItem, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { DeleteDashboardDialog } from '../DeleteDashboardDialog/DeleteDashboardDialog';
import { RenameDashboardDialog } from '../RenameDashboardDialog/RenameDashboardDialog';
import { useIsReadonly } from '../../model/config-client';
import { DashboardDataGrid, Row } from './DashboardDataGrid';

export interface DashboardListProperties {
  dashboardList: DashboardResource[];
  hideToolbar?: boolean;
  initialState?: GridInitialStateCommunity;
  isLoading?: boolean;
}

/**
 * Display dashboards in a table style.
 * @param props.dashboardList Contains all dashboards to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 */
export function DashboardList(props: DashboardListProperties) {
  const { dashboardList, hideToolbar, isLoading, initialState } = props;

  const isReadonly = useIsReadonly();

  const getDashboard = useCallback(
    (project: string, name: string) => {
      return dashboardList.find(
        (dashboard) => dashboard.metadata.project === project && dashboard.metadata.name === name
      );
    },
    [dashboardList]
  );

  const rows = useMemo(() => {
    return dashboardList.map(
      (dashboard) =>
        ({
          project: dashboard.metadata.project,
          name: dashboard.metadata.name,
          displayName: dashboardDisplayName(dashboard),
          version: dashboard.metadata.version,
          createdAt: dashboard.metadata.created_at,
          updatedAt: dashboard.metadata.updated_at,
        } as Row)
    );
  }, [dashboardList]);

  const [targetedDashboard, setTargetedDashboard] = useState<DashboardResource>();
  const [isRenameDashboardDialogStateOpened, setRenameDashboardDialogStateOpened] = useState<boolean>(false);
  const [isDeleteDashboardDialogStateOpened, setDeleteDashboardDialogStateOpened] = useState<boolean>(false);

  const onRenameButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedDashboard(getDashboard(project, name));
      setRenameDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const onDeleteButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedDashboard(getDashboard(project, name));
      setDeleteDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      { field: 'project', headerName: 'Project', type: 'string', flex: 2, minWidth: 150 },
      { field: 'displayName', headerName: 'Display Name', type: 'string', flex: 3, minWidth: 150 },
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
    [isReadonly, onRenameButtonClick, onDeleteButtonClick]
  );

  return (
    <Stack width="100%">
      <DashboardDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
      ></DashboardDataGrid>
      <Box>
        {targetedDashboard && (
          <Box>
            <RenameDashboardDialog
              open={isRenameDashboardDialogStateOpened}
              onClose={() => setRenameDashboardDialogStateOpened(false)}
              dashboard={targetedDashboard}
            />
            <DeleteDashboardDialog
              open={isDeleteDashboardDialogStateOpened}
              onClose={() => setDeleteDashboardDialogStateOpened(false)}
              dashboard={targetedDashboard}
            />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
