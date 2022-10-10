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
import { PanelDrawer, Dashboard } from '../../components';
import PanelGroupDialog from '../../components/PanelGroupDialog/PanelGroupDialog';
import { DashboardToolbar } from '../../components/DashboardToolbar';
import DeletePanelGroupDialog from '../../components/PanelGroupDialog/DeletePanelGroupDialog';

export interface DashboardAppProps {
  dashboardResource: DashboardResource;
}

export const DashboardApp = (props: DashboardAppProps) => {
  const { dashboardResource } = props;
  return (
    <Box
      sx={{
        padding: (theme) => theme.spacing(1, 0),
        flexGrow: 1,
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DashboardToolbar dashboardName={dashboardResource.metadata.name} />
      <Box sx={{ padding: (theme) => theme.spacing(2) }}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <Dashboard />
        </ErrorBoundary>
        <PanelDrawer />
        <PanelGroupDialog />
        <DeletePanelGroupDialog />
      </Box>
    </Box>
  );
};
