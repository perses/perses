import {
  DataSourceDefinition,
  AnyDataSourceDefinition,
  JsonObject,
  ResourceSelector,
  useDataSourceConfig,
} from '@perses-ui/core';

export const PrometheusDataSourceKind = 'PrometheusDataSource' as const;

type PrometheusDataSource = DataSourceDefinition<
  Kind,
  PrometheusDataSourceOptions
>;

type Kind = typeof PrometheusDataSourceKind;
export interface PrometheusDataSourceOptions extends JsonObject {
  base_url: string;
}

export function usePrometheusConfig(selector: ResourceSelector) {
  return useDataSourceConfig(selector, isPromDataSource).options;
}

function isPromDataSource(
  def: AnyDataSourceDefinition
): def is PrometheusDataSource {
  return typeof def.options['base_url'] === 'string';
}
