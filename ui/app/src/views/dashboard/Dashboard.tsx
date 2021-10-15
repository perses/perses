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

import { Box, Hidden } from '@mui/material';
import { DashboardResource } from '@perses-ui/core';
import Dashboard from '../../components/Dashboard';
import { DashboardContextProvider } from '../../context/dashboard';
import OptionsDrawer from './OptionsDrawer';

export interface DashboardViewProps {
  resource: DashboardResource;
}

/**
 * The View for viewing a Dashboard.
 */
function DashboardView(props: DashboardViewProps) {
  const { resource } = props;
  return (
    <DashboardContextProvider resource={resource}>
      <Box sx={{ display: 'flex' }}>
        <Box sx={{ padding: (theme) => theme.spacing(1, 2), flexGrow: 1 }}>
          <Dashboard />
        </Box>
        <Hidden mdDown>
          <OptionsDrawer />
        </Hidden>
      </Box>
    </DashboardContextProvider>
  );
}

export default DashboardView;
