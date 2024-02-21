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

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
} from './model/route';
import { useIsAuthEnable, useIsSignUpDisable } from './context/Config';

// Other routes are lazy-loaded for code-splitting
const ImportView = lazy(() => import('./views/import/ImportView'));
const AdminView = lazy(() => import('./views/admin/AdminView'));
const ConfigView = lazy(() => import('./views/config/ConfigView'));
const GuardedProjectRoute = lazy(() => import('./guard/GuardedProjectRoute'));
const ProjectView = lazy(() => import('./views/projects/ProjectView'));
const CreateDashboardView = lazy(() => import('./views/projects/dashboards/CreateDashboardView'));
const DashboardView = lazy(() => import('./views/projects/dashboards/DashboardView'));
const ExploreView = lazy(() => import('./views/projects/explore/ExploreView'));

function Router() {
  const isAuthEnable = useIsAuthEnable();
  const isSignUpDisable = useIsSignUpDisable();
  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      {/* TODO: What sort of loading fallback do we want? */}
      <Suspense>
        <Routes>
          {isAuthEnable && <Route path={SignInRoute} element={<SignInView />} />}
          {isAuthEnable && !isSignUpDisable && <Route path={SignUpRoute} element={<SignUpView />} />}
          <Route path={AdminRoute} element={<AdminView />} />
          <Route path={`${AdminRoute}/:tab`} element={<AdminView />} />
          <Route path={ConfigRoute} element={<ConfigView />} />
          <Route path={ImportRoute} element={<ImportView />} />
          <Route path={ProjectRoute} element={<HomeView />} />
          <Route path={ExploreRoute} element={<ExploreView />} />
          <Route path={`${ProjectRoute}/:projectName`} element={<GuardedProjectRoute />}>
            <Route path="" element={<ProjectView />} />
            <Route path=":tab" element={<ProjectView />} />
            <Route path="dashboard/new" element={<CreateDashboardView />} />
            <Route path="dashboards/:dashboardName" element={<DashboardView />} />
          </Route>
          <Route path="/" element={<HomeView />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Router;
