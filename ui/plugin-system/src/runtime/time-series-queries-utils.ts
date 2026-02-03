// LOGZ.IO FILE:: APPZ-955-math-on-queries-formulas

// Copyright 2024 The Perses Authors
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

import { TimeSeriesData, TimeSeriesQueryDefinition } from '@perses-dev/core';
import { QueryKey, QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import { TimeSeriesQueryContext, TimeSeriesQueryPlugin, TimeSeriesQueryPluginDependencies } from '../model';
import { usePluginRegistry } from './plugin-registry';
import { filterVariableStateMap, getVariableValuesKey } from './utils';

export const TIME_SERIES_QUERY_KEY = 'TimeSeriesQuery';

export interface QueryOptionsResult {
  queryKey: QueryKey;
  queryEnabled: boolean;
  dependencies: TimeSeriesQueryPluginDependencies;
}

export function getQueryOptions(
  plugin: TimeSeriesQueryPlugin | undefined,
  definition: TimeSeriesQueryDefinition,
  context: TimeSeriesQueryContext
): QueryOptionsResult {
  const { timeRange, suggestedStepMs, mode, variableState } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  const definitionQueryKey: TimeSeriesQueryDefinition = { ...definition, spec: { plugin: definition.spec.plugin } };

  const queryKey = [
    'query',
    TIME_SERIES_QUERY_KEY,
    definitionQueryKey,
    timeRange,
    variablesValueKey,
    suggestedStepMs,
    mode,
  ] as const;

  let waitToLoad = false;
  if (variableDependencies) {
    waitToLoad = variableDependencies.some((v) => variableState[v]?.loading);
  }

  const queryEnabled = plugin !== undefined && !waitToLoad;

  return { queryKey, queryEnabled, dependencies };
}

export function extractQueryDependencies(
  definitions: TimeSeriesQueryDefinition[],
  plugins: Array<{ data?: TimeSeriesQueryPlugin }>,
  context: TimeSeriesQueryContext
): Map<number, number[]> {
  const dependencies = new Map<number, number[]>();

  definitions.forEach((definition, idx) => {
    const plugin = plugins[idx]?.data;
    const deps = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
    dependencies.set(idx, deps?.queries ?? []);
  });

  return dependencies;
}

export function areDependenciesResolved(
  queryIndex: number,
  dependencies: Map<number, number[]>,
  resolvedResults: Map<number, TimeSeriesData>
): boolean {
  const deps = dependencies.get(queryIndex) ?? [];
  if (deps.length === 0) return true;

  const externalDeps = deps.filter((depIdx) => depIdx !== queryIndex);
  if (externalDeps.length === 0) return true;

  return externalDeps.every((depIdx) => resolvedResults.has(depIdx));
}

interface CircularDependencyState {
  visited: Set<number>;
  recursionStack: Set<number>;
}

function detectCircularDependencyInternal(
  currentQueryIndex: number,
  dependencies: Map<number, number[]>,
  state: CircularDependencyState
): { hasCycle: boolean; cyclePath: number[] } {
  state.visited.add(currentQueryIndex);
  state.recursionStack.add(currentQueryIndex);

  const deps = dependencies.get(currentQueryIndex) ?? [];
  const externalDeps = deps.filter((depIdx) => depIdx !== currentQueryIndex);

  for (const depIndex of externalDeps) {
    if (!state.visited.has(depIndex)) {
      const result = detectCircularDependencyInternal(depIndex, dependencies, state);
      if (result.hasCycle) {
        return { hasCycle: true, cyclePath: [currentQueryIndex, ...result.cyclePath] };
      }
    } else if (state.recursionStack.has(depIndex)) {
      return { hasCycle: true, cyclePath: [currentQueryIndex, depIndex] };
    }
  }

  state.recursionStack.delete(currentQueryIndex);
  return { hasCycle: false, cyclePath: [] };
}

export function detectCircularDependency(
  queryIndex: number,
  dependencies: Map<number, number[]>
): { hasCycle: boolean; cyclePath: number[] } {
  const state: CircularDependencyState = {
    visited: new Set(),
    recursionStack: new Set(),
  };
  return detectCircularDependencyInternal(queryIndex, dependencies, state);
}

export function formatCyclePath(cyclePath: number[]): string {
  return cyclePath.map((idx) => `Query #${idx + 1}`).join(' -> ');
}

export function buildResolvedResults(results: Array<UseQueryResult<TimeSeriesData>>): Map<number, TimeSeriesData> {
  const map = new Map<number, TimeSeriesData>();
  results.forEach((result, idx) => {
    if (result?.data) {
      map.set(idx, result.data);
    }
  });
  return map;
}

export function getResultsFingerprint(map: Map<number, TimeSeriesData>): string {
  return Array.from(map.entries())
    .map(([idx, data]) => `${idx}:${data.series?.length ?? 0}`)
    .join(',');
}

export function getDependencyFingerprint(
  resolvedResults: Map<number, TimeSeriesData>,
  dependencies: Map<number, number[]>,
  queryIndex: number
): string {
  const deps = dependencies.get(queryIndex) ?? [];
  const externalDeps = deps.filter((depIdx) => depIdx !== queryIndex);

  if (externalDeps.length === 0) return '';

  return externalDeps
    .map((depIdx) => {
      const data = resolvedResults.get(depIdx);
      if (!data) return `${depIdx}:null`;

      const seriesCount = data.series?.length ?? 0;
      const firstTs = data.series?.[0]?.values?.[0]?.[0] ?? 0;
      const lastTs = data.series?.[0]?.values?.slice(-1)?.[0]?.[0] ?? 0;

      return `${depIdx}:${seriesCount}:${firstTs}:${lastTs}`;
    })
    .join('|');
}

export interface CreateQueryConfigParams {
  definition: TimeSeriesQueryDefinition;
  plugin: TimeSeriesQueryPlugin | undefined;
  context: TimeSeriesQueryContext;
  queryIndex: number;
  getPlugin: ReturnType<typeof usePluginRegistry>['getPlugin'];
  queryOptions?: Omit<QueryObserverOptions, 'queryKey'>;
  resolvedResults: Map<number, TimeSeriesData>;
  dependencies: Map<number, number[]>;
}

export function createQueryConfig({
  definition,
  plugin,
  context,
  queryIndex,
  getPlugin,
  queryOptions,
  resolvedResults,
  dependencies,
}: CreateQueryConfigParams): QueryObserverOptions {
  const { queryEnabled, queryKey } = getQueryOptions(plugin, definition, context);

  const deps = dependencies.get(queryIndex) ?? [];
  const hasDeps = deps.length > 0;

  const circularCheck = hasDeps
    ? detectCircularDependency(queryIndex, dependencies)
    : { hasCycle: false, cyclePath: [] };
  const hasCircularDependency = circularCheck.hasCycle;

  const depsResolved = hasCircularDependency || areDependenciesResolved(queryIndex, dependencies, resolvedResults);
  const depsFingerprint = hasDeps ? getDependencyFingerprint(resolvedResults, dependencies, queryIndex) : '';

  const finalQueryKey = hasDeps ? [...queryKey, queryIndex, 'deps', depsFingerprint] : [...queryKey, queryIndex];

  return {
    ...queryOptions,
    enabled: (queryOptions?.enabled ?? true) && queryEnabled && depsResolved,
    queryKey: finalQueryKey,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<TimeSeriesData> => {
      if (hasCircularDependency) {
        const cyclePath = formatCyclePath(circularCheck.cyclePath);
        throw new Error(`Circular dependency detected: ${cyclePath}. Queries cannot depend on each other in a cycle.`);
      }

      const loadedPlugin = await getPlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind);
      const ctx: TimeSeriesQueryContext = {
        ...context,
        queryIndex,
        resolvedQueryResults: resolvedResults,
      };
      return loadedPlugin.getTimeSeriesData(definition.spec.plugin.spec, ctx, signal);
    },
  };
}
