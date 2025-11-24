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

import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { ChartsProvider, ErrorAlert, ErrorBoundary, useChartsTheme, useChartsContext } from '@perses-dev/components';
import { DashboardResource, EphemeralDashboardResource } from '@perses-dev/core';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import {
  PanelDrawer,
  Dashboard,
  PanelGroupDialog,
  DeletePanelGroupDialog,
  DashboardDiscardChangesConfirmationDialog,
  DashboardToolbar,
  DeletePanelDialog,
  EmptyDashboardProps,
  EditJsonDialog,
  SaveChangesConfirmationDialog,
  LeaveDialog,
} from '../../components';
import { OnSaveDashboard, useDashboard, useDiscardChangesConfirmationDialog, useEditMode } from '../../context';

export interface DashboardAppProps {
  dashboardResource: DashboardResource | EphemeralDashboardResource;
  emptyDashboardProps?: Partial<EmptyDashboardProps>;
  isReadonly: boolean;
  isVariableEnabled: boolean;
  isDatasourceEnabled: boolean;
  isCreating?: boolean;
  dashboardControlsComponent?: JSX.Element; // LOGZ.IO CHANGE:: Add support for dashboardControlsComponent
  isInitialVariableSticky?: boolean;
  // If true, browser confirmation dialog will be shown when navigating away with unsaved changes (closing tab, ...).
  isLeavingConfirmDialogEnabled?: boolean;
  dashboardTitleComponent?: ReactNode;
  onSave?: OnSaveDashboard;
  onDiscard?: (entity: DashboardResource) => void;
  onDashboardChange?: (dashboard: DashboardResource) => void; // LOGZ.IO CHANGE:: Alert users when trying to navigate out of dashboard in edit mode that has changes [APPZ-316]
}

export const DashboardApp = (props: DashboardAppProps): ReactElement => {
  const {
    dashboardResource,
    emptyDashboardProps,
    isReadonly,
    isVariableEnabled,
    isDatasourceEnabled,
    isCreating,
    isInitialVariableSticky,
    isLeavingConfirmDialogEnabled,
    dashboardTitleComponent,
    onSave,
    onDiscard,
    dashboardControlsComponent, // LOGZ.IO CHANGE:: Add support for dashboardControlsComponent
    onDashboardChange, // LOGZ.IO CHANGE:: Alert users when trying to navigate out of dashboard in edit mode that has changes [APPZ-316]
  } = props;

  const chartsTheme = useChartsTheme();
  const parentChartsContext = useChartsContext(); // LOGZ.IO CHANGE:: Custom Drilldown preview [APPZ-709]

  const { isEditMode, setEditMode } = useEditMode();
  const { dashboard, setDashboard } = useDashboard();
  const [originalDashboard, setOriginalDashboard] = useState<
    DashboardResource | EphemeralDashboardResource | undefined
  >(undefined);
  const { setSavedDatasources } = useDatasourceStore();

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const handleDiscardChanges = (): void => {
    // Reset to the original spec and exit edit mode
    if (originalDashboard) {
      setDashboard(originalDashboard);
    }
    setEditMode(false);
    closeDiscardChangesConfirmationDialog();
    if (onDiscard) {
      onDiscard(dashboard as unknown as DashboardResource);
    }
  };

  // LOGZ.IO CHANGE START:: Alert users when trying to navigate out of dashboard in edit mode that has changes [APPZ-316]
  useEffect(() => {
    onDashboardChange?.(dashboard as unknown as DashboardResource);
  }, [dashboard, onDashboardChange, originalDashboard]);
  // LOGZ.IO CHANGE END:: Alert users when trying to navigate out of dashboard in edit mode that has changes [APPZ-316]

  const onEditButtonClick = (): void => {
    setEditMode(true);
    setOriginalDashboard(dashboard);
    setSavedDatasources(dashboard.spec.datasources ?? {});
  };

  const onCancelButtonClick = (): void => {
    // check if dashboard has been modified
    if (JSON.stringify(dashboard) === JSON.stringify(originalDashboard)) {
      setEditMode(false);
    } else {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          handleDiscardChanges();
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
      });
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashboardToolbar
        dashboardName={dashboardResource.metadata.name}
        dashboardTitleComponent={dashboardTitleComponent}
        initialVariableIsSticky={isInitialVariableSticky}
        onSave={onSave}
        isReadonly={isReadonly}
        isVariableEnabled={isVariableEnabled}
        isDatasourceEnabled={isDatasourceEnabled}
        onEditButtonClick={onEditButtonClick}
        onCancelButtonClick={onCancelButtonClick}
        dashboardControlsComponent={dashboardControlsComponent}
      />
      <Box sx={{ paddingTop: 2, paddingX: 2, height: '100%' }}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <Dashboard
            emptyDashboardProps={{
              onEditButtonClick,
              ...emptyDashboardProps,
            }}
          />
        </ErrorBoundary>
        <ChartsProvider
          chartsTheme={chartsTheme}
          enablePinning={true} // LOGZ.IO CHANGE:: Custom Drilldown preview [APPZ-709]
          enableSyncGrouping={false} // LOGZ.IO CHANGE:: Shared tooltip in edit panel bug-fix [APPZ-498]
          pointActions={parentChartsContext.pointActions || []} // LOGZ.IO CHANGE:: Custom Drilldown preview [APPZ-709]
        >
          <PanelDrawer />
        </ChartsProvider>
        <PanelGroupDialog />
        <DeletePanelGroupDialog />
        <DeletePanelDialog />
        <DashboardDiscardChangesConfirmationDialog />
        <EditJsonDialog isReadonly={!isEditMode} disableMetadataEdition={!isCreating} />
        <SaveChangesConfirmationDialog />
        {isLeavingConfirmDialogEnabled && isEditMode && (
          <LeaveDialog original={originalDashboard} current={dashboard} />
        )}
      </Box>
    </Box>
  );
};
