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

import { Box, useTheme } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { ReactElement, Suspense, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { ReactRouterProvider } from '@perses-dev/plugin-system';
import Header from './components/Header/Header';
import Footer from './components/Footer';
import { SignInRoute, SignUpRoute } from './model/route';
import { PersesLoader } from './components/PersesLoader';

function isDashboardViewRoute(pathname: string): boolean {
  return /\/projects\/[a-zA-Z0-9_]+\/dashboards\/[a-zA-Z0-9_]+/.test(pathname);
}

function App(): ReactElement {
  const location = useLocation();
  const theme = useTheme();
  const isOverlayScrollExcluded = [SignInRoute, SignUpRoute].includes(location.pathname);

  const appContent = useMemo(() => {
    const actualContent = (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          backgroundColor: ({ palette }) => palette.background.default,
          '--perses-colors-gray-100': (theme) => theme.palette.grey[100],
          '--perses-colors-gray-300': (theme) => theme.palette.grey[300],
          '--perses-colors-primary': (theme) => theme.palette.primary.main,
        }}
      >
        <ReactRouterProvider>
          <Suspense fallback={<PersesLoader />}>
            <Outlet />
          </Suspense>
        </ReactRouterProvider>
      </Box>
    );
    return !isOverlayScrollExcluded ? (
      <OverlayScrollbarsComponent
        options={{
          scrollbars: {
            autoHide: 'never',
            theme: theme.palette.mode === 'dark' ? 'os-theme-light' : 'os-theme-dark',
          },
        }}
        style={{ flex: 1, display: 'flex' }}
      >
        {actualContent}
      </OverlayScrollbarsComponent>
    ) : (
      actualContent
    );
  }, [isOverlayScrollExcluded, theme.palette.mode]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: ({ palette }) => palette.background.default,
      }}
    >
      {location.pathname !== SignInRoute && location.pathname !== SignUpRoute && <Header />}
      {appContent}
      {!isDashboardViewRoute(location.pathname) && <Footer />}
    </Box>
  );
}

export default App;
