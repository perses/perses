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
import { DashboardResource } from '@perses-ui/core';
import Footer from '../../components/Footer';
import { DashboardContextProvider } from './DashboardContextProvider';
import Dashboard from './Dashboard';
import OptionsDrawer from './OptionsDrawer';

export interface DashboardViewProps {
  resource: DashboardResource;
}

/**
 * The View for viewing a Dashboard.
 */
function ViewDashboard(props: DashboardViewProps) {
  const { resource } = props;
  return (
    <DashboardContextProvider resource={resource}>
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
            // overflowX: 'hidden',
            // overflowY: 'auto',
          }}
        >
          <Dashboard />
          <Footer />
        </Box>

        <OptionsDrawer />
      </Box>
    </DashboardContextProvider>
  );
}

export default ViewDashboard;
