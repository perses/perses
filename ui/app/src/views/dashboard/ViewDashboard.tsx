// Copyright 2021 The Perses Authors
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
import { DashboardResource /*toAbsoluteTimeRange*/ } from '@perses-dev/core';
import { Dashboard, VariableOptionsDrawer } from '@perses-dev/dashboards';
// import { useState } from 'react';
import Footer from '../../components/Footer';
import { useVariablesState } from './variables';

export interface DashboardViewProps {
  resource: DashboardResource;
}

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard(props: DashboardViewProps) {
  const { resource } = props;

  const variables = useVariablesState(resource);
  // const [timeRange] = useState(toAbsoluteTimeRange({ pastDuration: resource.spec.duration }));

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          padding: (theme) => theme.spacing(1, 2),
          flexGrow: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
        }}
      >
        <Dashboard spec={resource.spec} />
        <Footer />
      </Box>

      <VariableOptionsDrawer
        variables={resource.spec.variables}
        variablesState={variables.state}
        onVariableValueChange={variables.setValue}
        onVariableOptionsChange={variables.setOptions}
      />
    </Box>
  );
}

export default ViewDashboard;
