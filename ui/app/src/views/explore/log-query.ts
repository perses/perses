// Copyright The Perses Authors
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

import type { PluginEditorValue } from '@perses-dev/plugin-system';
import type { DatasourceSelector, QueryDefinition, UnknownSpec } from '@perses-dev/spec';

export const LOKI_LOG_QUERY_KIND = 'LokiLogQuery';
export const LOKI_DATASOURCE_KIND = 'LokiDatasource';

export type LogsDirection = 'backward' | 'forward';

/** Spec of the LokiLogQuery plugin. */
export interface LokiLogQuerySpec extends UnknownSpec {
  query: string;
  datasource?: DatasourceSelector;
  direction?: LogsDirection;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDatasourceSelector(value: unknown): value is DatasourceSelector {
  return (
    isRecord(value) && typeof value.kind === 'string' && (value.name === undefined || typeof value.name === 'string')
  );
}

export function isLogsDirection(value: unknown): value is LogsDirection {
  return value === 'backward' || value === 'forward';
}

/** Reads the first log query of the explorer data. The data comes from the URL, so its shape is checked. */
export function getLogQuery(data: unknown): QueryDefinition | undefined {
  if (!isRecord(data) || !Array.isArray(data.queries)) return undefined;
  for (const query of data.queries) {
    if (!isRecord(query) || query.kind !== 'LogQuery' || !isRecord(query.spec)) continue;
    const plugin = query.spec.plugin;
    if (isRecord(plugin) && typeof plugin.kind === 'string' && isRecord(plugin.spec)) {
      return { kind: 'LogQuery', spec: { plugin: { kind: plugin.kind, spec: plugin.spec } } };
    }
  }
  return undefined;
}

/** Reads a LokiLogQuery spec, dropping the fields that do not have the expected type. */
export function toLokiSpec(spec: UnknownSpec): LokiLogQuerySpec {
  const { query, datasource, direction, ...rest } = spec;
  return {
    ...rest,
    query: typeof query === 'string' ? query : '',
    ...(isDatasourceSelector(datasource) ? { datasource } : {}),
    ...(isLogsDirection(direction) ? { direction } : {}),
  };
}

export function toEditorValue(query: QueryDefinition | undefined): PluginEditorValue {
  if (!query) return { selection: { type: 'LogQuery', kind: LOKI_LOG_QUERY_KIND }, spec: { query: '' } };
  return { selection: { type: 'LogQuery', kind: query.spec.plugin.kind }, spec: query.spec.plugin.spec };
}

export function toQueryDefinition(value: PluginEditorValue): QueryDefinition {
  return { kind: 'LogQuery', spec: { plugin: { kind: value.selection.kind, spec: value.spec } } };
}
