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

import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
// Default route is eagerly loaded
import HomeView from './views/home/HomeView';
// Other routes are lazy-loaded for code-splitting
const MigrateView = lazy(() => import('./views/MigrateView'));
const AdminView = lazy(() => import('./views/admin/AdminView'));
const GuardedProjectRoute = lazy(() => import('./GuardedProjectRoute'));
const ProjectView = lazy(() => import('./views/projects/ProjectView'));
const CreateDashboardView = lazy(() => import('./views/projects/dashboards/CreateDashboardView'));
const DashboardView = lazy(() => import('./views/projects/dashboards/DashboardView'));

function Router() {
  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      {/* TODO: What sort of loading fallback do we want? */}
      <Suspense>
        <Routes>
          <Route path="/admin" element={<AdminView />} />
          <Route path="/admin/:tab" element={<AdminView />} />
          <Route path="/migrate" element={<MigrateView />} />
          <Route path="/projects" element={<HomeView />} />
          <Route path="/projects/:projectName" element={<GuardedProjectRoute />}>
            <Route path="" element={<ProjectView />} />
            <Route path=":tab" element={<ProjectView />} />
            <Route path="dashboard/new" element={<CreateDashboardView />} />
            <Route path="dashboards/:dashboardName" element={<DashboardView />} />
          </Route>
          <Route path="/" element={<HomeView />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Router;
