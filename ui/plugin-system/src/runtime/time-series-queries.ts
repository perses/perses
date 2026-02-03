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

import { TimeSeriesData, TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/core';
import {
  Query,
  QueryCache,
  QueryKey,
  QueryObserverOptions,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { TimeSeriesDataQuery, TimeSeriesQueryContext, TimeSeriesQueryMode } from '../model';
import { useStableQueries } from '../hooks';
import { useTimeRange } from './TimeRangeProvider';
import { useDatasourceStore } from './datasources';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';
import { useAllVariableValues } from './variables';
// LOGZ.IO CHANGE START:: APPZ-955-math-on-queries-formulas
import {
  TIME_SERIES_QUERY_KEY,
  getQueryOptions,
  extractQueryDependencies,
  buildResolvedResults,
  getResultsFingerprint,
  createQueryConfig,
} from './time-series-queries-utils';
// LOGZ.IO CHANGE END:: APPZ-955-math-on-queries-formulas

export { TIME_SERIES_QUERY_KEY } from './time-series-queries-utils';

export interface UseTimeSeriesQueryOptions {
  suggestedStepMs?: number;
  mode?: TimeSeriesQueryMode;
}

/**
 * Runs a time series query using a plugin and returns the results.
 */
export function useTimeSeriesQuery(
  definition: TimeSeriesQueryDefinition,
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: QueryObserverOptions<TimeSeriesData>
): UseQueryResult<TimeSeriesData> {
  const { data: plugin } = usePlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind);
  const context = useTimeSeriesQueryContext();
  const { queryEnabled, queryKey } = getQueryOptions(plugin, definition, context);

  return useQuery({
    enabled: (queryOptions?.enabled ?? true) && queryEnabled,
    queryKey: queryKey,
    queryFn: ({ signal }) => {
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
      return plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx, signal);
    },
  });
}

/**
 * Runs multiple time series queries using plugins and returns the results.
 * Supports queries that depend on other query results via dependsOn.queries.
 * Handles chained dependencies of any depth via dynamic dependency resolution.
 */
export function useTimeSeriesQueries(
  definitions: TimeSeriesQueryDefinition[],
  options?: UseTimeSeriesQueryOptions,
  queryOptions?: Omit<QueryObserverOptions, 'queryKey'>
): Array<UseQueryResult<TimeSeriesData>> {
  // Track resolved results in state to trigger re-renders for dependent queries
  const [resolvedResults, setResolvedResults] = useState<Map<number, TimeSeriesData>>(new Map());

  const { getPlugin } = usePluginRegistry();
  const baseContext = useTimeSeriesQueryContext();

  const context = useMemo(
    () => ({
      ...baseContext,
      mode: options?.mode,
      suggestedStepMs: options?.suggestedStepMs,
    }),
    [baseContext, options?.mode, options?.suggestedStepMs]
  );

  const pluginLoaderResponse = usePlugins(
    TIME_SERIES_QUERY_KEY,
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  // LOGZ.IO CHANGE START:: APPZ-955-math-on-queries-formulas
  const dependencies = useMemo(
    () => extractQueryDependencies(definitions, pluginLoaderResponse, context),
    [definitions, pluginLoaderResponse, context]
  );

  const queries = useMemo(() => {
    return definitions.map((definition, idx) =>
      createQueryConfig({
        definition,
        plugin: pluginLoaderResponse[idx]?.data,
        context,
        queryIndex: idx,
        getPlugin,
        queryOptions,
        resolvedResults,
        dependencies,
      })
    );
  }, [definitions, pluginLoaderResponse, context, dependencies, getPlugin, queryOptions, resolvedResults]);

  // LOGZ.IO CHANGE:: Performance optimization [APPZ-359] useStableQueries()
  const results = useStableQueries({ queries }) as Array<UseQueryResult<TimeSeriesData>>;

  // Sync resolved results when query data changes
  useEffect(() => {
    const newResolved = buildResolvedResults(results);
    const newFingerprint = getResultsFingerprint(newResolved);
    const currentFingerprint = getResultsFingerprint(resolvedResults);

    if (newFingerprint !== currentFingerprint) {
      setResolvedResults(newResolved);
    }
  }, [results, resolvedResults]);

  return results;
  // LOGZ.IO CHANGE END:: APPZ-955-math-on-queries-formulas
}

/**
 * Build the time series query context object from data available at runtime
 */
function useTimeSeriesQueryContext(): TimeSeriesQueryContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    timeRange: absoluteTimeRange,
    variableState,
    datasourceStore,
  };
}

/**
 * Get active time series queries for query results summary
 */
export function useActiveTimeSeriesQueries(): TimeSeriesDataQuery[] {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  return getActiveTimeSeriesQueries(queryCache);
}

/**
 * Filter all cached queries down to only active time series queries
 */
export function getActiveTimeSeriesQueries(cache: QueryCache): TimeSeriesDataQuery[] {
  const queries: TimeSeriesDataQuery[] = [];

  for (const query of cache.findAll({ type: 'active' })) {
    const firstPart = query.queryKey?.[0] as UnknownSpec;
    if (firstPart?.kind && (firstPart.kind as string).startsWith(TIME_SERIES_QUERY_KEY)) {
      queries.push(query as Query<TimeSeriesData, unknown, TimeSeriesData, QueryKey>);
    }
  }

  return queries;
}
