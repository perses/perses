// Copyright 2025 The Perses Authors
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

import { useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { PluginRegistry } from '@perses-dev/plugin-system';
import Header from './components/Header/Header';
import Footer from './components/Footer';
import Router from './Router';
import { SignInRoute, SignUpRoute } from './model/route';
import { AuthorizationProvider } from './context/Authorization';
import { bundledPluginLoader } from './model/bundled-plugins';

function isDashboardViewRoute(pathname: string): boolean {
  return /\/projects\/[a-zA-Z0-9_]+\/dashboards\/[a-zA-Z0-9_]+/.test(pathname);
}

function App(): ReactElement {
  const location = useLocation();
  return (
    <AuthorizationProvider>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: ({ palette }) => palette.background.default,
        }}
      >
        <PluginRegistry pluginLoader={bundledPluginLoader}>
          {location.pathname !== SignInRoute && location.pathname !== SignUpRoute && <Header />}
        </PluginRegistry>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
          }}
        >
          <Router />
        </Box>
        {!isDashboardViewRoute(location.pathname) && <Footer />}
      </Box>
    </AuthorizationProvider>
  );
}

export default App;
