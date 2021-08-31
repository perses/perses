import { usePluginRuntime } from '../context/PluginRuntimeContext';
import { UseChartQueryHook } from '../model/chart-query';
import { JsonObject } from '../model/definitions';

export const useChartQuery: UseChartQueryHook<string, JsonObject> = (
  definition
) => {
  return usePluginRuntime('useChartQuery')(definition);
};
