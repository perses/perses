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

import {
  getResourceDisplayName,
  DashboardResource,
  DashboardSelector,
  EphemeralDashboardInfo,
  getResourceExtendedDisplayName,
} from '@perses-dev/core';
import { Stack } from '@mui/material';
import { GridColDef, GridRowParams } from '@mui/x-data-grid';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/Pencil';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import { useSnackbar } from '@perses-dev/components';
import { CreateDashboardDialog, DeleteResourceDialog, RenameDashboardDialog } from '../dialogs';
import { CRUDGridActionsCellItem } from '../CRUDButton/CRUDGridActionsCellItem';
import {
  CREATED_AT_COL_DEF,
  DISPLAY_NAME_COL_DEF,
  ListProperties,
  PROJECT_COL_DEF,
  UPDATED_AT_COL_DEF,
  VERSION_COL_DEF,
} from '../list';
import { useDeleteDashboardMutation } from '../../model/dashboard-client';
import { DashboardDataGrid, Row } from './DashboardDataGrid';

export interface DashboardListProperties extends ListProperties {
  dashboardList: DashboardResource[];
  isEphemeralDashboardEnabled: boolean;
}

/**
 * Display dashboards in a table style.
 * @param props.dashboardList Contains all dashboards to display
 * @param props.hideToolbar Hide toolbar if enabled
 * @param props.initialState Provide a way to override default initialState
 * @param props.isLoading Display a loading circle if enabled
 * @param props.isEphemeralDashboardEnabled Display switch button if ephemeral dashboards are enabled in copy dialog.
 */
export function DashboardList(props: DashboardListProperties): ReactElement {
  const navigate = useNavigate();
  const { dashboardList, hideToolbar, isLoading, initialState, isEphemeralDashboardEnabled } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteDashboardMutation = useDeleteDashboardMutation();

  const getDashboard = useCallback(
    (project: string, name: string) => {
      return dashboardList.find(
        (dashboard) => dashboard.metadata.project === project && dashboard.metadata.name === name
      );
    },
    [dashboardList]
  );

  const rows = useMemo(() => {
    return dashboardList.map<Row>((dashboard, index) => ({
      index,
      project: dashboard.metadata.project,
      name: dashboard.metadata.name,
      displayName: getResourceDisplayName(dashboard),
      version: dashboard.metadata.version ?? 0,
      createdAt: dashboard.metadata.createdAt ?? '',
      updatedAt: dashboard.metadata.updatedAt ?? '',
    }));
  }, [dashboardList]);

  const [targetedDashboard, setTargetedDashboard] = useState<DashboardResource>();
  const [isDuplicateDashboardDialogStateOpened, setDuplicateDashboardDialogStateOpened] = useState<boolean>(false);
  const [isRenameDashboardDialogStateOpened, setRenameDashboardDialogStateOpened] = useState<boolean>(false);
  const [isDeleteDashboardDialogStateOpened, setDeleteDashboardDialogStateOpened] = useState<boolean>(false);

  const handleRenameButtonClick = useCallback(
    (project: string, name: string) => (): void => {
      setTargetedDashboard(getDashboard(project, name));
      setRenameDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const handleDashboardDuplication = useCallback(
    (dashboardInfo: DashboardSelector | EphemeralDashboardInfo) => {
      if (targetedDashboard) {
        if ('ttl' in dashboardInfo) {
          navigate(`/projects/${targetedDashboard.metadata.project}/ephemeraldashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                ttl: dashboardInfo.ttl,
                ...{
                  display: {
                    name: dashboardInfo.dashboard,
                  },
                },
              },
            },
          });
        } else {
          navigate(`/projects/${targetedDashboard.metadata.project}/dashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                ...{
                  display: {
                    name: dashboardInfo.dashboard,
                  },
                },
              },
            },
          });
        }
      }
    },
    [navigate, targetedDashboard]
  );

  const handleDuplicateButtonClick = useCallback(
    (project: string, name: string) => (): void => {
      setTargetedDashboard(getDashboard(project, name));
      setDuplicateDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const handleDashboardDelete = useCallback(
    (dashboard: DashboardResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteDashboardMutation.mutate(dashboard, {
          onSuccess: (deletedDashboard: DashboardResource) => {
            successSnackbar(`Dashboard ${getResourceExtendedDisplayName(deletedDashboard)} was successfully deleted`);
            resolve();
          },
          onError: (err) => {
            exceptionSnackbar(err);
            reject();
            throw err;
          },
        });
      }),
    [exceptionSnackbar, successSnackbar, deleteDashboardMutation]
  );

  const handleDeleteButtonClick = useCallback(
    (project: string, name: string) => (): void => {
      setTargetedDashboard(getDashboard(project, name));
      setDeleteDashboardDialogStateOpened(true);
    },
    [getDashboard]
  );

  const columns = useMemo<Array<GridColDef<Row>>>(
    () => [
      PROJECT_COL_DEF,
      DISPLAY_NAME_COL_DEF,
      VERSION_COL_DEF,
      CREATED_AT_COL_DEF,
      UPDATED_AT_COL_DEF,
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        flex: 0.5,
        minWidth: 100,
        getActions: (params: GridRowParams<Row>): ReactElement[] => [
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
      {targetedDashboard && (
        <>
          <RenameDashboardDialog
            open={isRenameDashboardDialogStateOpened}
            dashboard={targetedDashboard}
            onClose={() => setRenameDashboardDialogStateOpened(false)}
          />
          <CreateDashboardDialog
            open={isDuplicateDashboardDialogStateOpened}
            projects={[{ kind: 'Project', metadata: { name: targetedDashboard.metadata.project }, spec: {} }]}
            hideProjectSelect={true}
            mode="duplicate"
            name={getResourceDisplayName(targetedDashboard)}
            onSuccess={handleDashboardDuplication}
            onClose={() => setDuplicateDashboardDialogStateOpened(false)}
            isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
          />
          <DeleteResourceDialog
            open={isDeleteDashboardDialogStateOpened}
            resource={targetedDashboard}
            onSubmit={(v) => handleDashboardDelete(v).then(() => setDeleteDashboardDialogStateOpened(false))}
            onClose={() => setDeleteDashboardDialogStateOpened(false)}
          />
        </>
      )}
    </Stack>
  );
}
