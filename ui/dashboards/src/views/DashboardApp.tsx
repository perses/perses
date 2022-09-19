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
import { combineSx } from '@perses-dev/components';
import { VariableList, Dashboard } from '../components';
import PanelGroupDialog from '../components/PanelGroupDialog/PanelGroupDialog';
import PanelDrawer from '../components/PanelDrawer/PanelDrawer';
import { DashboardToolbar } from '../components/DashboardToolbar';
import { useDashboard, useDashboardApp } from '../context';
import { ViewDashboardProps } from './ViewDashboard';

export const DashboardApp = (props: ViewDashboardProps) => {
  const { dashboardResource, sx, children, ...others } = props;
  const { dashboard } = useDashboard();
  const { panelGroupDialog } = useDashboardApp();

  return (
    <Box
      sx={combineSx(
        {
          display: 'flex',
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
        },
        sx
      )}
      {...others}
    >
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
        <VariableList variables={dashboardResource.spec.variables} sx={{ margin: (theme) => theme.spacing(1, 0, 2) }} />
        <Dashboard spec={dashboard} />
        <PanelDrawer />
        {panelGroupDialog && <PanelGroupDialog />}
        {children}
      </Box>
    </Box>
  );
};
