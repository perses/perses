import { DataFrame } from './data-frame';
import { Definition, JsonObject } from './definitions';
import { AnyPluginDefinition, AnyPluginImplementation } from './plugins';
import { ResourceSelector } from './resource';

export interface ChartQueryDefinition<
  Kind extends string,
  Options extends JsonObject
> extends Definition<Kind, Options> {
  datasource?: ResourceSelector;
}

export interface ChartQueryPlugin<
  Kind extends string,
  Options extends JsonObject
> {
  useChartQuery: UseChartQueryHook<Kind, Options>;
}

export type UseChartQueryHook<
  Kind extends string,
  Options extends JsonObject
> = (definition: ChartQueryDefinition<Kind, Options>) => {
  data: DataFrame[];
  loading: boolean;
  error?: Error;
};

export type AnyChartQueryDefinition = AnyPluginDefinition<'ChartQuery'>;

export type AnyChartQueryPlugin = AnyPluginImplementation<'ChartQuery'>;
