// Copyright The Perses Authors
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

import { Stack } from '@mui/material';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResourceDisplayName, getResourceExtendedDisplayName, useSnackbar } from '@perses-dev/components';
import { EphemeralDashboardInfo, FolderResource, DashboardResource } from '@perses-dev/client';
import { DashboardSelector } from '@perses-dev/spec';
import { useDeleteDashboardMutation } from '../../model/dashboard-client';
import {
  AddFolderDialog,
  CreateDashboardDialog,
  DeleteResourceDialog,
  EditDashboardDialog,
  EditFolderDialog,
} from '../dialogs';
import { DeleteFolderDialog } from '../dialogs/DeleteFolderDialog';
import { useNavHistory } from '../../context/DashboardNavHistory';
import DashboardTreeList from './DashboardTreeList';

type editDashboardAction = { type: 'editDashboard'; target: DashboardResource };
type duplicateDashboardAction = { type: 'duplicateDashboard'; target: DashboardResource };
type deleteDashboardAction = { type: 'deleteDashboard'; target: DashboardResource };
type deleteFolderAction = { type: 'deleteFolder'; target: FolderResource; path: string[] };
type editFolderAction = {
  type: 'editFolder';
  target: FolderResource;
  availableDashboards: Map<string, DashboardListRow>;
  path: string[];
};
type addFolder = {
  type: 'addFolder';
  target: FolderResource;
  availableDashboards: Map<string, DashboardListRow>;
  path: string[];
};
type openDialogAction =
  | editDashboardAction
  | duplicateDashboardAction
  | deleteDashboardAction
  | editFolderAction
  | addFolder
  | deleteFolderAction
  | { type: 'none' };
type openDialogActionType = openDialogAction['type'];

export interface DashboardListRow {
  index: number;
  project: string;
  name: string;
  displayName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  viewedAt?: string;
}

export interface DashboardListProperties {
  dashboardList: DashboardResource[];
  folderList: FolderResource[];
  isLoading: boolean;
  isEphemeralDashboardEnabled: boolean;
}

/**
 * Display dashboards in a tree style.
 * @param props.dashboardList Contains all dashboards to display
 * @param props.isLoading Display a loading circle if enabled
 * @param props.isEphemeralDashboardEnabled Display switch button if ephemeral dashboards are enabled in copy dialog.
 */
export function DashboardList(props: DashboardListProperties): ReactElement {
  const navigate = useNavigate();
  const { dashboardList, folderList, isLoading, isEphemeralDashboardEnabled } = props;
  const { successSnackbar, exceptionSnackbar } = useSnackbar();
  const deleteDashboardMutation = useDeleteDashboardMutation();
  const navHistory = useNavHistory();
  const dashboardsRows = useMemo(() => {
    const historyMap = new Map(navHistory.map((h) => [`${h.project}/${h.name}`, h.date]));
    return dashboardList.map<DashboardListRow>((dashboard, index) => {
      const viewedAt = historyMap.get(`${dashboard.metadata.project}/${dashboard.metadata.name}`);
      return {
        index,
        project: dashboard.metadata.project,
        name: dashboard.metadata.name,
        displayName: getResourceDisplayName(dashboard),
        version: dashboard.metadata.version ?? 0,
        createdAt: dashboard.metadata.createdAt ?? '',
        updatedAt: dashboard.metadata.updatedAt ?? '',
        tags: dashboard.metadata.tags ?? [],
        viewedAt,
      };
    });
  }, [dashboardList, navHistory]);

  const dashboardsMap = useMemo(() => {
    const map = new Map<string, Map<string, DashboardListRow>>();
    dashboardsRows.forEach((dashboard) => {
      const projectMap = map.get(dashboard.project) ?? new Map<string, DashboardListRow>();
      projectMap.set(dashboard.name, dashboard);
      map.set(dashboard.project, projectMap);
    });
    return map;
  }, [dashboardsRows]);

  const [activeDialog, setActiveDialog] = useState<openDialogAction>({ type: 'none' });

  const openDialog = useCallback(
    (dialog: openDialogActionType) => (project: string, name: string, path?: string[]) => (): void => {
      switch (dialog) {
        case 'editDashboard':
        case 'duplicateDashboard':
        case 'deleteDashboard': {
          const dashboard = dashboardsMap.get(project)?.get(name);
          const dashboardResource = dashboard ? dashboardList[dashboard.index] : undefined;
          if (dashboardResource) {
            setActiveDialog({ type: dialog, target: dashboardResource });
          }
          break;
        }
        case 'editFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (target) {
            setActiveDialog({
              type: 'editFolder',
              target,
              availableDashboards: dashboardsMap.get(project) ?? new Map(),
              path: [...(path ?? []), name].slice(1),
            });
          }
          break;
        }
        case 'addFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (target) {
            setActiveDialog({
              type: 'addFolder',
              target,
              availableDashboards: dashboardsMap.get(project) ?? new Map(),
              path: [...(path ?? []), name].slice(1),
            });
          }
          break;
        }
        case 'deleteFolder': {
          const target = folderList.find((folder) => folder.metadata.name === (path?.[0] ?? name));
          if (!target) break;
          setActiveDialog({
            type: 'deleteFolder',
            target: target,
            path: [...(path ?? []), name].slice(1),
          });
          break;
        }
      }
    },
    [dashboardList, dashboardsMap, folderList]
  );

  const handleRenameButtonClick = openDialog('editDashboard');
  const handleDuplicateButtonClick = openDialog('duplicateDashboard');
  const handleDeleteButtonClick = openDialog('deleteDashboard');
  const handleEditFolderButtonClick = openDialog('editFolder');
  const handleAddFolderButtonClick = openDialog('addFolder');
  const handleDeleteFolderButtonClick = openDialog('deleteFolder');

  const closeDialog = useCallback(() => setActiveDialog({ type: 'none' }), []);

  const handleDashboardDuplication = useCallback(
    (dashboardInfo: DashboardSelector | EphemeralDashboardInfo) => {
      if (activeDialog.type === 'duplicateDashboard') {
        const targetedDashboard = activeDialog.target;
        if ('ttl' in dashboardInfo) {
          navigate(`/projects/${targetedDashboard.metadata.project}/ephemeraldashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                ttl: dashboardInfo.ttl,
                display: { name: dashboardInfo.dashboard },
              },
            },
          });
        } else {
          navigate(`/projects/${targetedDashboard.metadata.project}/dashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...targetedDashboard.spec,
                display: { name: dashboardInfo.dashboard },
              },
            },
          });
        }
      }
    },
    [navigate, activeDialog]
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

  return (
    <Stack width="100%">
      <DashboardTreeList
        folderList={folderList}
        dashboardsMap={dashboardsMap}
        handleRenameButtonClick={handleRenameButtonClick}
        handleDuplicateButtonClick={handleDuplicateButtonClick}
        handleDeleteButtonClick={handleDeleteButtonClick}
        handleEditFolderButtonClick={handleEditFolderButtonClick}
        handleAddFolderButtonClick={handleAddFolderButtonClick}
        handleDeleteFolderButtonClick={handleDeleteFolderButtonClick}
        isLoading={isLoading}
      />
      {activeDialog.type === 'editDashboard' && (
        <EditDashboardDialog
          open={activeDialog.type === 'editDashboard'}
          dashboard={activeDialog.target}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'duplicateDashboard' && (
        <CreateDashboardDialog
          open={activeDialog.type === 'duplicateDashboard'}
          projects={[{ kind: 'Project', metadata: { name: activeDialog.target.metadata.project }, spec: {} }]}
          hideProjectSelect={true}
          mode="duplicate"
          name={getResourceDisplayName(activeDialog.target)}
          onSuccess={handleDashboardDuplication}
          onClose={closeDialog}
          isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        />
      )}
      {activeDialog.type === 'deleteDashboard' && (
        <DeleteResourceDialog
          open={activeDialog.type === 'deleteDashboard'}
          resource={activeDialog.target}
          onSubmit={(v) => handleDashboardDelete(v).then(closeDialog)}
          onClose={closeDialog}
        />
      )}
      {activeDialog.type === 'editFolder' && (
        <EditFolderDialog
          open={activeDialog.type === 'editFolder'}
          folder={activeDialog.target}
          dashboards={activeDialog.availableDashboards}
          path={activeDialog.path}
          onClose={closeDialog}
          onSuccess={closeDialog}
        />
      )}
      {activeDialog.type === 'addFolder' && (
        <AddFolderDialog
          open={activeDialog.type === 'addFolder'}
          folder={activeDialog.target}
          dashboards={activeDialog.availableDashboards}
          path={activeDialog.path}
          onClose={closeDialog}
          onSuccess={closeDialog}
        />
      )}
      {activeDialog.type === 'deleteFolder' && (
        <DeleteFolderDialog
          open={activeDialog.type === 'deleteFolder'}
          folder={activeDialog.target}
          path={activeDialog.path}
          onClose={closeDialog}
        />
      )}
    </Stack>
  );
}
