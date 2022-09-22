// Copyright 2022 The Perses Authors
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

import { Box } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DashboardResource } from '@perses-dev/core';
import { TemplateVariableList, Dashboard } from '../../components';
import PanelGroupDialog from '../../components/PanelGroupDialog/PanelGroupDialog';
import PanelDrawer from '../../components/PanelDrawer/PanelDrawer';
import { DashboardToolbar } from '../../components/DashboardToolbar';
import { useDashboard, useDashboardApp } from '../../context';

export interface DashboardAppProps {
  dashboardResource: DashboardResource;
}

export const DashboardApp = (props: DashboardAppProps) => {
  const { dashboardResource } = props;
  const { dashboard } = useDashboard();
  const { panelGroupDialog } = useDashboardApp();
  return (
    <Box
      sx={{
        padding: (theme) => theme.spacing(1, 2),
        flexGrow: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashboardToolbar dashboardName={dashboardResource.metadata.name} />
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <TemplateVariableList />
      </ErrorBoundary>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <Dashboard spec={dashboard} />
      </ErrorBoundary>
      <PanelDrawer />
      {panelGroupDialog && <PanelGroupDialog />}
    </Box>
  );
};
