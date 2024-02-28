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

import { getDashboardDisplayName, DashboardResource, DashboardSelector } from '@perses-dev/core';
import { Box, Stack, Tooltip } from '@mui/material';
import { GridColDef, GridRowParams, GridValueGetterParams } from '@mui/x-data-grid';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { useCallback, useMemo, useState } from 'react';
import { intlFormatDistance } from 'date-fns';
import { GridInitialStateCommunity } from '@mui/x-data-grid/models/gridStateCommunity';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { CreateDashboardDialog, DeleteDashboardDialog, RenameDashboardDialog } from '../dialogs';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
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
  const navigate = useNavigate();
  const { dashboardList, hideToolbar, isLoading, initialState } = props;

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
          displayName: getDashboardDisplayName(dashboard),
          version: dashboard.metadata.version,
          createdAt: dashboard.metadata.createdAt,
          updatedAt: dashboard.metadata.updatedAt,
        }) as Row
    );
  }, [dashboardList]);

  const [targetedDashboard, setTargetedDashboard] = useState<DashboardResource>();
  const [isDuplicateDashboardDialogStateOpened, setDuplicateDashboardDialogStateOpened] = useState<boolean>(false);
  const [isRenameDashboardDialogStateOpened, setRenameDashboardDialogStateOpened] = useState<boolean>(false);
  const [isDeleteDashboardDialogStateOpened, setDeleteDashboardDialogStateOpened] = useState<boolean>(false);

  const handleRenameButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedDashboard(getDashboard(project, name));
      setRenameDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const handleDashboardDuplication = useCallback(
    (dashboardSelector: DashboardSelector) => {
      if (targetedDashboard) {
        navigate(`/projects/${targetedDashboard.metadata.project}/dashboard/new`, {
          state: {
            name: dashboardSelector.dashboard,
            spec: {
              ...targetedDashboard.spec,
              ...{
                display: {
                  name: dashboardSelector.dashboard,
                },
              },
            },
          },
        });
      }
    },
    [navigate, targetedDashboard]
  );

  const handleDuplicateButtonClick = useCallback(
    (project: string, name: string) => () => {
      setTargetedDashboard(getDashboard(project, name));
      setDuplicateDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const handleDeleteButtonClick = useCallback(
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
          <CRUDGridActionsCellItem
            key={params.id + '-edit'}
            icon={<PencilIcon />}
            label="Rename"
            action="update"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleRenameButtonClick(params.row.project, params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-duplicate'}
            icon={<ContentCopyIcon />}
            label="Duplicate"
            action="create"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleDuplicateButtonClick(params.row.project, params.row.name)}
          />,
          <CRUDGridActionsCellItem
            key={params.id + '-delete'}
            icon={<DeleteIcon />}
            label="Delete"
            action="delete"
            scope="Dashboard"
            project={params.row.project}
            onClick={handleDeleteButtonClick(params.row.project, params.row.name)}
          />,
        ],
      },
    ],
    [handleRenameButtonClick, handleDuplicateButtonClick, handleDeleteButtonClick]
  );

  return (
    <Stack width="100%">
      <DashboardDataGrid
        rows={rows}
        columns={columns}
        initialState={initialState}
        hideToolbar={hideToolbar}
        isLoading={isLoading}
      />
      <Box>
        {targetedDashboard && (
          <>
            <RenameDashboardDialog
              open={isRenameDashboardDialogStateOpened}
              dashboard={targetedDashboard}
              onClose={() => setRenameDashboardDialogStateOpened(false)}
            />
            <CreateDashboardDialog
              open={isDuplicateDashboardDialogStateOpened}
              projectOptions={[targetedDashboard.metadata.project]}
              hideProjectSelect={true}
              title={`Duplicate Dashboard: ${getDashboardDisplayName(targetedDashboard)}`}
              onSuccess={handleDashboardDuplication}
              onClose={() => setDuplicateDashboardDialogStateOpened(false)}
            />
            <DeleteDashboardDialog
              open={isDeleteDashboardDialogStateOpened}
              dashboard={targetedDashboard}
              onClose={() => setDeleteDashboardDialogStateOpened(false)}
            />
          </>
        )}
      </Box>
    </Stack>
  );
}
