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
import { PluginRegistry } from './context/plugin-registry';
import ViewDashboard from './views/dashboard/ViewDashboard';
import AlertErrorFallback from './components/AlertErrorFallback';
import { DataSourceRegistry } from './context/DataSourceRegistry';
import { useSampleData } from './utils/temp-sample-data';
import Header from './components/Header';
import Footer from './components/Footer';
import { pluginRuntime } from './model/plugin-runtime';

function App() {
  const dashboard = useSampleData<DashboardResource>(
    new URLSearchParams(window.location.search).get('dashboard') ||
      'nodeExporterDashboard'
  );
  if (dashboard === undefined) {
    return null;
  }

  return (
    <>
      <Header />
      <PluginRegistry
        loadingFallback="Loading..."
        ErrorFallbackComponent={AlertErrorFallback}
        runtime={pluginRuntime}
      >
        <DataSourceRegistry>
          <ViewDashboard resource={dashboard} />
        </DataSourceRegistry>
      </PluginRegistry>
      <Footer />
    </>
  );
}

export default App;
