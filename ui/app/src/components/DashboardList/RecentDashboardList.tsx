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

import { DashboardResource, dashboardDisplayName } from '@perses-dev/core';
import { Box, Stack, Tooltip } from '@mui/material';
import { GridColDef, GridActionsCellItem, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import { DeleteDashboardDialog } from '../DeleteDashboardDialog/DeleteDashboardDialog';
import { RenameDashboardDialog } from '../RenameDashboardDialog/RenameDashboardDialog';
import { DatedDashboards } from '../../model/dashboard-client';
import { DashboardDataGrid, Row } from './DashboardDataGrid';

export interface RecentDashboardListProperties {
  dashboardList: DatedDashboards[];
  hideToolbar?: boolean;
  isLoading?: boolean;
}

export function RecentDashboardList(props: RecentDashboardListProperties) {
  const { dashboardList, hideToolbar, isLoading } = props;

  const getDashboard = useCallback(
    (project: string, name: string) => {
      return dashboardList.find(
        (datedDashboard) =>
          datedDashboard.dashboard.metadata.project === project && datedDashboard.dashboard.metadata.name === name
      )?.dashboard;
    },
    [dashboardList]
  );

  const rows = useMemo(() => {
    return dashboardList.map(
      (datedDashboard) =>
        ({
          project: datedDashboard.dashboard.metadata.project,
          name: datedDashboard.dashboard.metadata.name,
          displayName: dashboardDisplayName(datedDashboard.dashboard),
          version: datedDashboard.dashboard.metadata.version,
          createdAt: datedDashboard.dashboard.metadata.created_at,
          updatedAt: datedDashboard.dashboard.metadata.updated_at,
          viewedAt: datedDashboard.date,
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
        field: 'viewedAt',
        headerName: 'Last Seen',
        type: 'dateTime',
        flex: 1,
        minWidth: 150,
        valueGetter: (params: GridValueGetterParams) => new Date(params.row.viewedAt),
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
            onClick={onRenameButtonClick(params.row.project, params.row.name)}
          />,
          <GridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            onClick={onDeleteButtonClick(params.row.project, params.row.name)}
          />,
        ],
      },
    ],
    [onRenameButtonClick, onDeleteButtonClick]
  );

  return (
    <Stack width="100%">
      <DashboardDataGrid
        rows={rows}
        columns={columns}
        initialState={{
          columns: {
            columnVisibilityModel: {
              project: false,
              id: false,
              version: false,
              createdAt: false,
              updatedAt: false,
              actions: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'viewedAt', sort: 'desc' }],
          },
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
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
