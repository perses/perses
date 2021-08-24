import { DashboardResource } from '@perses-ui/core';
import { PluginRegistry } from './context/plugin-registry/PluginRegistry';
import DashboardView from './views/dashboard/Dashboard';
import AlertErrorFallback from './components/AlertErrorFallback';
import { DataSourceRegistry } from './context/DataSourceRegistry';
import { useSampleData } from './utils/temp-sample-data';

function App() {
  const dashboard = useSampleData<DashboardResource>('dashboard');
  if (dashboard === undefined) {
    return null;
  }

  return (
    <PluginRegistry
      loadingFallback="Loading..."
      ErrorFallbackComponent={AlertErrorFallback}
    >
      <DataSourceRegistry>
        <DashboardView resource={dashboard} />
      </DataSourceRegistry>
    </PluginRegistry>
  );
}

export default App;
