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

import { Button, CircularProgress, Stack } from '@mui/material';
import type { EphemeralDashboardInfo, FolderResource } from '@perses-dev/client';
import { Dialog, getResourceExtendedDisplayName, useSnackbar } from '@perses-dev/components';
import type { DashboardSelector } from '@perses-dev/spec';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNavHistory } from '../../context/DashboardNavHistory';
import type { PartialDashboardResource } from '../../model/dashboard-client';
import { useDashboard, useDeleteDashboardMutation } from '../../model/dashboard-client';
import type { SearchProjectResource } from '../../model/search-client';
import { AddFolderDialog } from '../dialogs/AddFolderDialog';
import { CreateDashboardDialog } from '../dialogs/CreateDashboardDialog';
import { DeleteFolderDialog } from '../dialogs/DeleteFolderDialog';
import { DeleteResourceDialog } from '../dialogs/DeleteResourceDialog';
import { EditDashboardDialog } from '../dialogs/EditDashboardDialog';
import { EditFolderDialog } from '../dialogs/EditFolderDialog';
import DashboardTreeList from './DashboardTreeList';

// `openedAt` is used to make sure the dashboard data rendered in the dialog has been fetched after the dialog was
// opened (i.e. it is not a stale cached version).
type editDashboardAction = { type: 'editDashboard'; target: SearchProjectResource; openedAt: number };
type duplicateDashboardAction = { type: 'duplicateDashboard'; target: SearchProjectResource; openedAt: number };
type deleteDashboardAction = { type: 'deleteDashboard'; target: SearchProjectResource };
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
  dashboardList: SearchProjectResource[];
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
        displayName: dashboard.displayName,
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

  // We must make sure the dashboard has been fetched *after* the dialog was opened: when stale cached data exists,
  // `isLoading` is false while a background refetch is in flight, and the user could edit/duplicate an outdated version
  // of the dashboard and overwrite a newer server spec.
  // We compare `dataUpdatedAt` with the time the dialog was opened rather than relying on `isFetching`: the update
  // mutation invalidates the dashboard queries on success, which triggers a refetch. Using `isFetching` would unmount
  // the dialog during that refetch and remount it once done, making the dialog flicker (close then re-open) on save.
  const duplicateDashboardTarget = activeDialog.type === 'duplicateDashboard' ? activeDialog.target : undefined;
  const {
    data: duplicateDashboardData,
    dataUpdatedAt: duplicateDashboardUpdatedAt,
    isFetching: isDuplicateDashboardFetching,
    error: duplicateDashboardError,
  } = useDashboard(
    duplicateDashboardTarget?.metadata.project ?? '',
    duplicateDashboardTarget?.metadata.name ?? '',
    !!duplicateDashboardTarget,
  );

  const editDashboardTarget = activeDialog.type === 'editDashboard' ? activeDialog.target : undefined;
  const {
    data: editDashboardData,
    dataUpdatedAt: editDashboardUpdatedAt,
    isFetching: isEditDashboardFetching,
    error: editDashboardError,
  } = useDashboard(
    editDashboardTarget?.metadata.project ?? '',
    editDashboardTarget?.metadata.name ?? '',
    !!editDashboardTarget,
  );

  const isEditDashboardReady =
    activeDialog.type === 'editDashboard' &&
    !!editDashboardData &&
    editDashboardUpdatedAt >= activeDialog.openedAt &&
    !editDashboardError;
  const isDuplicateDashboardReady =
    activeDialog.type === 'duplicateDashboard' &&
    !!duplicateDashboardData &&
    duplicateDashboardUpdatedAt >= activeDialog.openedAt &&
    !duplicateDashboardError;
  const isEditDashboardLoading =
    activeDialog.type === 'editDashboard' && !isEditDashboardReady && (isEditDashboardFetching || !editDashboardError);
  const isDuplicateDashboardLoading =
    activeDialog.type === 'duplicateDashboard' &&
    !isDuplicateDashboardReady &&
    (isDuplicateDashboardFetching || !duplicateDashboardError);
  const hasEditDashboardError =
    activeDialog.type === 'editDashboard' && !isEditDashboardReady && !isEditDashboardLoading && !!editDashboardError;
  const hasDuplicateDashboardError =
    activeDialog.type === 'duplicateDashboard' &&
    !isDuplicateDashboardReady &&
    !isDuplicateDashboardLoading &&
    !!duplicateDashboardError;

  const openDialog = useCallback(
    (dialog: openDialogActionType) => (project: string, name: string, path?: string[]) => (): void => {
      switch (dialog) {
        case 'editDashboard':
        case 'duplicateDashboard': {
          const dashboard = dashboardsMap.get(project)?.get(name);
          const dashboardResource = dashboard ? dashboardList[dashboard.index] : undefined;
          if (dashboardResource) {
            setActiveDialog({ type: dialog, target: dashboardResource, openedAt: Date.now() });
          }
          break;
        }
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
    [dashboardList, dashboardsMap, folderList],
  );

  const handleRenameButtonClick = useMemo(() => openDialog('editDashboard'), [openDialog]);
  const handleDuplicateButtonClick = useMemo(() => openDialog('duplicateDashboard'), [openDialog]);
  const handleDeleteButtonClick = useMemo(() => openDialog('deleteDashboard'), [openDialog]);
  const handleEditFolderButtonClick = useMemo(() => openDialog('editFolder'), [openDialog]);
  const handleAddFolderButtonClick = useMemo(() => openDialog('addFolder'), [openDialog]);
  const handleDeleteFolderButtonClick = useMemo(() => openDialog('deleteFolder'), [openDialog]);

  const closeDialog = useCallback(() => setActiveDialog({ type: 'none' }), []);

  const handleDashboardDuplication = useCallback(
    (dashboardInfo: DashboardSelector | EphemeralDashboardInfo) => {
      if (activeDialog.type === 'duplicateDashboard' && duplicateDashboardData) {
        const targetedDashboard = activeDialog.target;
        if ('ttl' in dashboardInfo) {
          navigate(`/projects/${targetedDashboard.metadata.project}/ephemeraldashboard/new`, {
            state: {
              name: dashboardInfo.dashboard,
              spec: {
                ...duplicateDashboardData.spec,
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
                ...duplicateDashboardData.spec,
                display: { name: dashboardInfo.dashboard },
              },
            },
          });
        }
      }
    },
    [navigate, activeDialog, duplicateDashboardData],
  );

  const handleDashboardDelete = useCallback(
    (dashboard: PartialDashboardResource): Promise<void> =>
      new Promise((resolve, reject) => {
        deleteDashboardMutation.mutate(dashboard, {
          onSuccess: (deletedDashboard: PartialDashboardResource) => {
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
    [exceptionSnackbar, successSnackbar, deleteDashboardMutation],
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
      {(isEditDashboardLoading || isDuplicateDashboardLoading) && (
        <Dialog open onClose={closeDialog} aria-labelledby="loading-dialog" fullWidth={true}>
          <Dialog.Header>{activeDialog.type === 'editDashboard' ? 'Edit' : 'Duplicate'} Dashboard</Dialog.Header>
          <Dialog.Content sx={{ width: '100%' }}>
            <Stack alignItems="center" justifyContent="center">
              <CircularProgress />
            </Stack>
          </Dialog.Content>
        </Dialog>
      )}
      {(hasEditDashboardError || hasDuplicateDashboardError) && (
        <Dialog open onClose={closeDialog} aria-labelledby="error-dialog" fullWidth={true}>
          <Dialog.Header>{activeDialog.type === 'editDashboard' ? 'Edit' : 'Duplicate'} Dashboard</Dialog.Header>
          <Dialog.Content sx={{ width: '100%' }}>
            {`Failed to load the dashboard: ${(editDashboardError ?? duplicateDashboardError)?.message}`}
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="outlined" color="secondary" onClick={closeDialog}>
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      )}
      {activeDialog.type === 'editDashboard' && isEditDashboardReady && editDashboardData && (
        <EditDashboardDialog open dashboard={editDashboardData} onClose={closeDialog} />
      )}
      {activeDialog.type === 'duplicateDashboard' && isDuplicateDashboardReady && (
        <CreateDashboardDialog
          open={activeDialog.type === 'duplicateDashboard'}
          projects={[{ kind: 'Project', metadata: { name: activeDialog.target.metadata.project }, spec: {} }]}
          hideProjectSelect={true}
          mode="duplicate"
          name={activeDialog.target.displayName}
          onSuccess={handleDashboardDuplication}
          onClose={closeDialog}
          isEphemeralDashboardEnabled={isEphemeralDashboardEnabled}
        />
      )}
      {activeDialog.type === 'deleteDashboard' && (
        <DeleteResourceDialog
          open={activeDialog.type === 'deleteDashboard'}
          resource={{
            kind: 'Dashboard',
            metadata: activeDialog.target.metadata,
            spec:
              // If the display name is the same as the metadata name, we don't need to pass it to the delete dialog, otherwise we need to pass it.
              // It will preserve the display name in the delete dialog and show it to the user.
              activeDialog.target.displayName === activeDialog.target.metadata.name
                ? undefined
                : { display: { name: activeDialog.target.displayName } },
          }}
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
