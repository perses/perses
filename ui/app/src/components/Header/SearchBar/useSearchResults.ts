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

import type { KVSearchResult, MatchingResult } from '@nexucis/kvsearch';
import { KVSearch } from '@nexucis/kvsearch';
import { useMemo } from 'react';

import {
  useImportantDashboardGroups,
  useIsProjectDatasourceEnabled,
  useShouldNormalizeResourceNames,
} from '../../../context/Config';
import { resolveImportantDashboardList, useDashboardList } from '../../../model/dashboard-client';
import { useDatasourceList } from '../../../model/datasource-client';
import { useGlobalDatasourceList } from '../../../model/global-datasource-client';
import { useProjectList } from '../../../model/project-client';
import { useSearchDashboards } from '../../../model/search-client';
import type { SearchProjectResource } from '../../../model/search-client';
import type { HighlightedDashboardResource, ResourceType, SearchItem, SearchResultSection } from './model';

const kvSearch = new KVSearch<SearchItem>({
  indexedKeys: [
    ['metadata', 'name'],
    ['metadata', 'tags'],
    ['spec', 'display', 'name'],
  ],
  shouldSort: true,
  includeMatches: true,
  shouldRender: false,
  excludedChars: [' '],
  findAllMatches: true,
});

export interface SearchResults {
  // Only contains the active resource types, in display order.
  sections: SearchResultSection[];
  // Number of dashboards and datasources per project, displayed next to the project results.
  dashboardCounts: Map<string, number>;
  datasourceCounts: Map<string, number>;
}

function countByProject(resources: Array<{ metadata: { project: string } }> | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { metadata } of resources ?? []) {
    counts.set(metadata.project, (counts.get(metadata.project) ?? 0) + 1);
  }
  return counts;
}

// isLoading is false while cached data is refetched, e.g. after an invalidation. isFetching is checked too,
// so that "No records found" is not displayed before the latest data is received.
function isPending(query: { isLoading: boolean; isFetching: boolean }): boolean {
  return query.isLoading || query.isFetching;
}

function useFilteredList(query: string, list: SearchItem[] | undefined): Array<KVSearchResult<SearchItem>> {
  return useMemo(() => (list ? kvSearch.filter(query, list) : []), [query, list]);
}

// The search API returns the value of the first indexed field matching the query, but not which field it is.
function getMatchedPath({ metadata, displayName, original }: SearchProjectResource): string[] | undefined {
  if (original === undefined) {
    return undefined;
  }
  if (original === displayName) {
    return ['spec', 'display', 'name'];
  }
  if (original === metadata.name) {
    return ['metadata', 'name'];
  }
  if (metadata.tags?.includes(original)) {
    return ['metadata', 'tags'];
  }
  return undefined;
}

/**
 * Searches the dashboards with the search API, and converts the results into the same structure as the other
 * resource types. The API only returns the metadata and the display name of the dashboards.
 */
function useDashboardSearchResults(query: string, enabled: boolean): Omit<SearchResultSection, 'type'> {
  const importantDashboardGroups = useImportantDashboardGroups();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();
  const searchQuery = useSearchDashboards(undefined, query.trim(), {
    enabled,
    staleTime: Infinity,
    // Keep displaying the results of the previous query while the results of the current one are loading.
    keepPreviousData: true,
  });
  const { data, error } = searchQuery;

  const results = useMemo((): Array<KVSearchResult<SearchItem>> => {
    if (!enabled || !data) {
      return [];
    }
    const dashboardResults = data.map((result, index): KVSearchResult<HighlightedDashboardResource> => {
      const dashboard = {
        kind: 'Dashboard',
        metadata: result.metadata,
        spec: { display: { name: result.displayName } },
        highlight: false,
      } as HighlightedDashboardResource;
      const path = getMatchedPath(result);
      const matched: MatchingResult[] | undefined =
        path && result.original !== undefined
          ? [{ path, value: result.original, intervals: result.intervals ?? [] }]
          : undefined;
      return { original: dashboard, rendered: dashboard, score: result.score ?? 0, index, matched };
    });
    const importantDashboardKeys = new Set(
      resolveImportantDashboardList(
        dashboardResults.map(({ original }) => original),
        importantDashboardGroups,
        shouldNormalizeResourceNames,
      ).map(({ metadata }) => `${metadata.project}/${metadata.name}`),
    );
    for (const { original } of dashboardResults) {
      original.highlight = importantDashboardKeys.has(`${original.metadata.project}/${original.metadata.name}`);
    }
    // Unlike the filtering done in the browser, the results of the search API are not sorted.
    return dashboardResults.toSorted((a, b) => b.score - a.score);
  }, [enabled, data, importantDashboardGroups, shouldNormalizeResourceNames]);

  // The results of the previous query are displayed while the current one is fetched, so it is considered as loading.
  return { results, isLoading: isPending(searchQuery), error };
}

/**
 * Fetches the resources of the active types and filters them with the query. Dashboards are searched by the search
 * API, while the other resource types are filtered in the browser.
 *
 * The search bar is always mounted in the header, so nothing is fetched until the search is enabled (i.e. opened)
 * with a non-empty query. Lists are kept in cache afterward and are only fetched again when invalidated.
 */
export function useSearchResults(query: string, activeTypes: Set<ResourceType>, enabled: boolean): SearchResults {
  const isSearching = enabled && query.trim().length > 0;
  const isActive = (type: ResourceType): boolean => isSearching && activeTypes.has(type);
  const isDashboardsActive = isActive('dashboards');
  const isProjectsActive = isActive('projects');
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();

  const dashboardSection = useDashboardSearchResults(query, isDashboardsActive);
  // The list of the dashboards is only needed to display the counts next to the project results.
  const dashboards = useDashboardList({ metadataOnly: true, staleTime: Infinity, enabled: isProjectsActive });
  const projects = useProjectList({ staleTime: Infinity, enabled: isProjectsActive });
  const globalDatasources = useGlobalDatasourceList({ staleTime: Infinity, enabled: isActive('globalDatasources') });
  const datasources = useDatasourceList({
    staleTime: Infinity,
    enabled: isActive('datasources') || (isProjectsActive && isProjectDatasourceEnabled),
  });

  const projectResults = useFilteredList(query, isProjectsActive ? projects.data : undefined);
  const globalDatasourceResults = useFilteredList(
    query,
    isActive('globalDatasources') ? globalDatasources.data : undefined,
  );
  const datasourceResults = useFilteredList(query, isActive('datasources') ? datasources.data : undefined);

  const dashboardCounts = useMemo(
    () => countByProject(isProjectsActive ? dashboards.data : undefined),
    [isProjectsActive, dashboards.data],
  );
  const datasourceCounts = useMemo(
    () => countByProject(isProjectsActive ? datasources.data : undefined),
    [isProjectsActive, datasources.data],
  );

  const sections: SearchResultSection[] = [
    { type: 'dashboards', ...dashboardSection },
    { type: 'projects', results: projectResults, isLoading: isPending(projects), error: projects.error },
    {
      type: 'globalDatasources',
      results: globalDatasourceResults,
      isLoading: isPending(globalDatasources),
      error: globalDatasources.error,
    },
    { type: 'datasources', results: datasourceResults, isLoading: isPending(datasources), error: datasources.error },
  ];

  return { sections: sections.filter(({ type }) => isActive(type)), dashboardCounts, datasourceCounts };
}
