import { usePluginRuntime } from '../context/PluginRuntimeContext';
import {
  DataSourceDefinition,
  DataSourceResource,
  AnyDataSourceDefinition,
} from '../model/datasource';
import { JsonObject } from '../model/definitions';
import { ResourceSelector } from '../model/resource';

export function useDataSources(
  selector: ResourceSelector
): DataSourceResource[] {
  return usePluginRuntime('useDataSources')(selector);
}

export function useDataSourceConfig<
  Kind extends string,
  Options extends JsonObject
>(
  selector: ResourceSelector,
  validate: (
    value: AnyDataSourceDefinition
  ) => value is DataSourceDefinition<Kind, Options>
): DataSourceDefinition<Kind, Options> {
  const dataSources = useDataSources(selector);
  if (dataSources.length > 1) {
    console.warn(`Got more than one DataSource for selector ${selector}`);
  }

  const ds = dataSources[0];
  if (ds === undefined) {
    throw new Error(`Could not find DataSource for selector ${selector}`);
  }

  if (validate(ds.spec.data_source)) {
    return ds.spec.data_source;
  }

  throw new Error(`DataSource spec for selector ${selector} is not valid`);
}
