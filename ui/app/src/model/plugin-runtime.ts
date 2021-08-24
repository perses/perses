import { PluginRuntime } from '@perses-ui/core';
import { useDashboardContext } from '../context/dashboard';
import { useDataSources } from '../context/DataSourceRegistry';
import { usePanelContext } from '../context/PanelContextProvider';
import { useChartQuery } from '../context/plugin-registry';

/**
 * The runtime implementations exposed to plugins.
 */
export const pluginRuntime: PluginRuntime = {
  useDashboardSpec: () => useDashboardContext().resource.spec,
  useDashboardVariables: () => useDashboardContext().variables.state,
  useDashboardTimeRange: () => useDashboardContext().timeRange,
  useDataSources: useDataSources,
  useChartQuery: useChartQuery,
  usePanelState: usePanelContext,
};
