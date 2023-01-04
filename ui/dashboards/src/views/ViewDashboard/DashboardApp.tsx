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

import { useState } from 'react';
import { Box } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import {
  PanelDrawer,
  Dashboard,
  PanelGroupDialog,
  DeletePanelGroupDialog,
  DiscardChangesConfirmationDialog,
  DashboardToolbar,
  DeletePanelDialog,
} from '../../components';
import { useDashboard, useDiscardChangesConfirmationDialog, useEditMode } from '../../context';

export interface DashboardAppProps {
  dashboardResource: DashboardResource;
  dashboardTitleComponent?: JSX.Element;
  onSave?: (entity: DashboardResource) => Promise<DashboardResource>;
  initialVariableIsSticky?: boolean;
  isReadonly: boolean;
}

export const DashboardApp = (props: DashboardAppProps) => {
  const { dashboardResource, dashboardTitleComponent, onSave, initialVariableIsSticky, isReadonly } = props;
  const { setEditMode } = useEditMode();
  const { dashboard, setDashboard } = useDashboard();
  const [originalDashboard, setOriginalDashboard] = useState<DashboardResource | undefined>(undefined);

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const handleDiscardChanges = () => {
    // Reset to the original spec and exit edit mode
    if (originalDashboard) {
      setDashboard(originalDashboard);
    }
    setEditMode(false);
    closeDiscardChangesConfirmationDialog();
  };

  const onEditButtonClick = () => {
    setEditMode(true);
    setOriginalDashboard(dashboard);
  };

  const onCancelButtonClick = () => {
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
        initialVariableIsSticky={initialVariableIsSticky}
        onSave={onSave}
        isReadonly={isReadonly}
        onEditButtonClick={onEditButtonClick}
        onCancelButtonClick={onCancelButtonClick}
      />
      <Box sx={{ padding: (theme) => theme.spacing(2) }}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <Dashboard />
        </ErrorBoundary>
        <PanelDrawer />
        <PanelGroupDialog />
        <DeletePanelGroupDialog />
        <DeletePanelDialog />
        <DiscardChangesConfirmationDialog />
      </Box>
    </Box>
  );
};
