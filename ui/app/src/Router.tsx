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
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
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
} from './model/route';
import {
  useIsAuthEnabled,
  useIsEphemeralDashboardEnabled,
  useIsExplorerEnabled,
  useIsSignUpDisable,
} from './context/Config';
import { buildRedirectQueryString, useIsAccessTokenExist } from './model/auth-client';

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
  const isAuthEnabled = useIsAuthEnabled();
  const isSignUpDisable = useIsSignUpDisable();
  const isEphemeralDashboardEnabled = useIsEphemeralDashboardEnabled();
  const isExplorerEnabled = useIsExplorerEnabled();
  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      {/* TODO: What sort of loading fallback do we want? */}
      <Suspense>
        <Routes>
          {isAuthEnabled && <Route path={SignInRoute} element={<SignInView />} />}
          {isAuthEnabled && !isSignUpDisable && <Route path={SignUpRoute} element={<SignUpView />} />}
          <Route
            path={ProfileRoute}
            element={
              <RequireAuth>
                <ProfileView />
              </RequireAuth>
            }
          />
          <Route
            path={AdminRoute}
            element={
              <RequireAuth>
                <AdminView />
              </RequireAuth>
            }
          />
          <Route
            path={`${AdminRoute}/:tab`}
            element={
              <RequireAuth>
                <AdminView />
              </RequireAuth>
            }
          />
          <Route
            path={ConfigRoute}
            element={
              <RequireAuth>
                <ConfigView />
              </RequireAuth>
            }
          />
          <Route
            path={ImportRoute}
            element={
              <RequireAuth>
                <ImportView />
              </RequireAuth>
            }
          />
          <Route
            path={ProjectRoute}
            element={
              <RequireAuth>
                <HomeView />
              </RequireAuth>
            }
          />
          {isExplorerEnabled && (
            <Route
              path={ExploreRoute}
              element={
                <RequireAuth>
                  <ExploreView />
                </RequireAuth>
              }
            />
          )}
          <Route
            path={`${ProjectRoute}/:projectName`}
            element={
              <RequireAuth>
                <GuardedProjectRoute />
              </RequireAuth>
            }
          >
            <Route path="" element={<ProjectView />} />
            <Route path=":tab" element={<ProjectView />} />
            <Route path="dashboard/new" element={<CreateDashboardView />} />
            <Route path="dashboards/:dashboardName" element={<DashboardView />} />
            {isEphemeralDashboardEnabled && (
              <Route path="ephemeraldashboard/new" element={<CreateEphemeralDashboardView />} />
            )}
            {isEphemeralDashboardEnabled && (
              <Route path="ephemeraldashboards/:ephemeralDashboardName" element={<EphemeralDashboardView />} />
            )}
          </Route>
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomeView />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
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
function RequireAuth({ children }: { children: ReactElement }): ReactElement | null {
  const isAuthEnabled = useIsAuthEnabled();
  const isAccessTokenExist = useIsAccessTokenExist();
  const location = useLocation();
  if (!isAuthEnabled || isAccessTokenExist) {
    return children;
  }
  let to = SignInRoute;
  if (location.pathname !== '' && location.pathname !== '/') {
    to += `?${buildRedirectQueryString(location.pathname + location.search)}`;
  }
  return <Navigate to={to} />;
}

export default Router;
