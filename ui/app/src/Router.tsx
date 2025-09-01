// Copyright 2024 The Perses Authors
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

import { Suspense, lazy, ReactElement } from 'react';
import { Navigate, useLocation, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
// Default route is eagerly loaded
import HomeView from './views/home/HomeView';
import SignInView from './views/auth/SignInView';
import SignUpView from './views/auth/SignUpView';
import {
  AdminRoute,
  ConfigRoute,
  ProjectRoute,
  ImportRoute,
  SignInRoute,
  SignUpRoute,
  ExploreRoute,
  ProfileRoute,
  getBasePathName,
} from './model/route';
import { useIsAuthEnabled } from './context/Config';
import { buildRedirectQueryString, useIsAccessTokenExist } from './model/auth-client';
import App from './App';
import { PersesLoader } from './components/PersesLoader';

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

function Router(): ReactElement {
  const router = createBrowserRouter(
    [
      {
        path: '/',
        Component: App,
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
              { path: ExploreRoute, Component: ExploreView },
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
                      { path: 'ephemeraldashboard/new', Component: CreateEphemeralDashboardView },
                      { path: 'ephemeraldashboards/:ephemeralDashboardName', Component: EphemeralDashboardView },
                      { path: ':tab', Component: ProjectView },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: SignInRoute,
            Component: SignInView,
          },
          {
            path: SignUpRoute,
            Component: SignUpView,
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

export default Router;
