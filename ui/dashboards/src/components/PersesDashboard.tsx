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

import { Box, BoxProps } from '@mui/material';
import { DashboardResource } from '@perses-dev/core';
import { combineSx } from '@perses-dev/components';
import { useState } from 'react';
import { VariableList, Dashboard } from '../components';
import AddPanel from '../components/AddPanel/AddPanel';
import { DashboardToolbar } from '../components/DashboardToolbar';
import { useDashboard } from '../context';

export interface PersesDashboardProps extends BoxProps {
  dashboardResource: DashboardResource;
}

export const PersesDashboard = (props: PersesDashboardProps) => {
  const { dashboardResource, sx, children, ...others } = props;
  const [showAddPanel, setShowAddPanel] = useState(false);
  const { dashboard } = useDashboard();

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
        <DashboardToolbar dashboardName={dashboardResource.metadata.name} onAddPanel={() => setShowAddPanel(true)} />
        <VariableList variables={dashboardResource.spec.variables} sx={{ margin: (theme) => theme.spacing(1, 0, 2) }} />
        <Dashboard spec={dashboard} />
        <AddPanel isOpen={showAddPanel} onClose={() => setShowAddPanel(false)} />
        {children}
      </Box>
    </Box>
  );
};
