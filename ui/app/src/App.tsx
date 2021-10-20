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

import { DashboardResource } from '@perses-ui/core';
// TODO: Figure out why the import path './context/plugin-registry' doesn't work
// (the app throws a TypeScript error in the browser) although there is an index.ts
// file in that directory that should expose everything.
import { PluginRegistry } from './project/dashboard/context/plugin-registry/PluginRegistry';
import DashboardView from './project/dashboard/Dashboard-view';
import AlertErrorFallback from './project/dashboard/components/AlertErrorFallback';
import { DataSourceRegistry } from './project/dashboard/context/DataSourceRegistry';
import { useSampleData } from './shared/utils/temp-sample-data';
import Header from './core/Header';
import Footer from './core/Footer';

function App() {
  const dashboard = useSampleData<DashboardResource>('dashboard');
  if (dashboard === undefined) {
    return null;
  }

  return (
    <>
      <Header />
      <PluginRegistry
        loadingFallback="Loading..."
        ErrorFallbackComponent={AlertErrorFallback}
      >
        <DataSourceRegistry>
          <DashboardView resource={dashboard} />
        </DataSourceRegistry>
      </PluginRegistry>
      <Footer />
    </>
  );
}

export default App;
