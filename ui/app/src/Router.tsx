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

import { SnackbarProvider } from '@perses-dev/components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, ReactElement, Suspense } from 'react';
import { CookiesProvider } from 'react-cookie';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router-dom';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';
import { PersesLoader } from './components/PersesLoader';
import { AuthorizationProvider } from './context/Authorization';
import {
  ConfigContextProvider,
  useIsAuthEnabled,
  useIsEphemeralDashboardEnabled,
  useIsExplorerEnabled,
} from './context/Config';
import { DarkModeContextProvider } from './context/DarkMode';
import { NavHistoryProvider } from './context/DashboardNavHistory';
import { buildRedirectQueryString, useIsAccessTokenExist } from './model/auth-client';
import {
  AdminRoute,
  ConfigRoute,
  ExploreRoute,
  getBasePathName,
  ImportRoute,
  ProfileRoute,
  ProjectRoute,
  SignInRoute,
  SignUpRoute,
} from './model/route';
import SignInView from './views/auth/SignInView';
import SignUpView from './views/auth/SignUpView';
import HomeView from './views/home/HomeView';
// Default route is eagerly loaded
import App from './App';

// Other routes are lazy-loaded for code-splitting
const ImportView = lazy(() => import('./views/import/ImportView'));
const AdminView = lazy(() => import('./views/admin/AdminView'));
const ConfigView = lazy(() => import('./views/config/ConfigView'));
const GuardedProjectRoute = lazy(() => import('./guard/GuardedProjectRoute'));
const ProjectView = lazy(() => import('./views/projects/ProjectView'));
const CreateDashboardView = lazy(() => import('./views/projects/dashboards/CreateDashboardView'));
const DashboardView = lazy(() => import('./views/projects/dashboards/DashboardView'));
const ExploreView = lazy(() => import('./views/projects/explore/ExploreView'));
const CreateEphemeralDashboardView = lazy(() => import('./views/projects/dashboards/CreateEphemeralDashboardView'));
const EphemeralDashboardView = lazy(() => import('./views/projects/dashboards/EphemeralDashboardView'));
const ProfileView = lazy(() => import('./views/profile/ProfileView'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // react-query uses a default of 3 retries.
      // This sets the default to 0 retries.
      // If needed, the number of retries can be overridden in individual useQuery calls.
      retry: 0,
    },
  },
});

function AppProviders(): ReactElement {
  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <DarkModeContextProvider>
          <ConfigContextProvider>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <NavHistoryProvider>
                <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                  <AuthorizationProvider>
                    <App />
                  </AuthorizationProvider>
                </SnackbarProvider>
              </NavHistoryProvider>
            </QueryParamProvider>
          </ConfigContextProvider>
        </DarkModeContextProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
}

function Router(): ReactElement {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        Component: AppProviders,
        children: [
          {
            path: '',
            element: <RequireAuth />,
            children: [
              { index: true, Component: HomeView },
              { path: ProfileRoute, Component: ProfileView },
              {
                path: AdminRoute,
                children: [
                  { index: true, Component: AdminView },
                  { path: ':tab', Component: AdminView },
                ],
              },
              { path: ConfigRoute, Component: ConfigView },
              { path: ImportRoute, Component: ImportView },
              { path: ProjectRoute, Component: ProjectView },
              {
                path: ExploreRoute,
                element: <RequireExplorerEnabled />,
                children: [{ index: true, Component: ExploreView }],
              },
              {
                path: ProjectRoute,
                element: <GuardedProjectRoute />,
                children: [
                  { index: true, element: <Navigate to="/" replace /> },
                  {
                    path: `:projectName`,
                    children: [
                      { index: true, Component: ProjectView },
                      { path: 'dashboard/new', Component: CreateDashboardView },
                      { path: 'dashboards/:dashboardName', Component: DashboardView },
                      {
                        path: 'ephemeraldashboard/new',
                        element: <RequireEphemeralDashboardEnabled />,
                        children: [{ index: true, Component: CreateEphemeralDashboardView }],
                      },
                      {
                        path: 'ephemeraldashboards/:ephemeralDashboardName',
                        element: <RequireEphemeralDashboardEnabled />,
                        children: [{ index: true, Component: EphemeralDashboardView }],
                      },
                      { path: ':tab', Component: ProjectView },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: SignInRoute,
            element: <RequireAuthEnabled />,
            children: [{ index: true, Component: SignInView }],
          },
          {
            path: SignUpRoute,
            element: <RequireAuthEnabled />,
            children: [{ index: true, Component: SignUpView }],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
    { basename: getBasePathName() }
  );

  return (
    <Suspense fallback={<PersesLoader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

/**
 * This component aims to redirect the user to the SignIn page if not logged in.
 * Otherwise, it just loads the underlying component(s) defined as children.
 * This is leveraging the following mechanism:
 * https://reactrouter.com/en/main/upgrading/v5#refactor-custom-routes
 * https://gist.github.com/mjackson/d54b40a094277b7afdd6b81f51a0393f
 * @param children
 * @constructor
 */
function RequireAuth(): ReactElement | null {
  const isAuthEnabled = useIsAuthEnabled();
  const isAccessTokenExist = useIsAccessTokenExist();
  const location = useLocation();
  if (!isAuthEnabled || isAccessTokenExist) {
    return <Outlet />;
  }
  let to = SignInRoute;
  if (location.pathname !== '' && location.pathname !== '/') {
    to += `?${buildRedirectQueryString(location.pathname + location.search)}`;
  }
  return <Navigate to={to} />;
}

function RequireAuthEnabled(): ReactElement {
  const isAuthEnabled = useIsAuthEnabled();
  if (!isAuthEnabled) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function RequireExplorerEnabled(): ReactElement {
  const isExplorerEnabled = useIsExplorerEnabled();
  if (!isExplorerEnabled) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function RequireEphemeralDashboardEnabled(): ReactElement {
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  if (!isEphemeralDashboardEnabled) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default Router;
