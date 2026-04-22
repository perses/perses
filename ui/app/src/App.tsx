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

import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import { ReactElement, Suspense, useEffect } from 'react';
import { ReactRouterProvider } from '@perses-dev/plugin-system';
import { BooleanParam, useQueryParam } from 'use-query-params';
import Header from './components/Header/Header';
import Footer from './components/Footer';
import { PlatformLoginRoute, SignInRoute, SignUpRoute } from './model/route';
import { PersesLoader } from './components/PersesLoader';
import { useBranding } from './model/branding-client';

function isDashboardViewRoute(pathname: string): boolean {
  return /\/projects\/[a-zA-Z0-9_]+\/dashboards\/[a-zA-Z0-9_]+/.test(pathname);
}

function App(): ReactElement {
  const location = useLocation();
  const { data: branding } = useBranding();
  const [detailedView] = useQueryParam('detailedView', BooleanParam);
  const isDetailedView = detailedView === true;

  useEffect(() => {
    if (branding?.favicons?.favicon96x96) {
      const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = branding.favicons?.favicon96x96;
      }
    }
  }, [branding]);

  // Hide header in detailed view mode or on login/signup pages
  const shouldShowHeader =
    !isDetailedView && location.pathname !== PlatformLoginRoute && location.pathname !== SignUpRoute;

  // Hide footer in detailed view mode or on dashboard view routes
  const shouldShowFooter = !isDetailedView && !isDashboardViewRoute(location.pathname);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: ({ palette }) => palette.background.default,
      }}
    >
      {shouldShowHeader && <Header />}

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
      {shouldShowFooter && <Footer />}
    </Box>
  );
}

export default App;
