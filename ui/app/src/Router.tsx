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
import MigrateView from './views/MigrateView';

// Other routes are lazy-loaded for code-splitting
const ViewDashboard = lazy(() => import('./views/ViewDashboard'));
const ViewProject = lazy(() => import('./views/projects/ProjectView'));

function Router() {
  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      {/* TODO: What sort of loading fallback to we want? */}
      <Suspense>
        <Routes>
          <Route path="/migrate" element={<MigrateView />} />
          <Route path="/projects" element={<HomeView />} />
          <Route path="/projects/:projectName/dashboards/:dashboardName" element={<ViewDashboard />} />
          <Route path="/projects/:projectName/dashboards/:dashboardName/:action" element={<ViewDashboard />} />
          <Route path="/projects/:projectName" element={<ViewProject />} />
          <Route path="/" element={<HomeView />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default Router;
