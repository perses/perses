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

import type { KVSearchResult } from '@nexucis/kvsearch';
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

function useFilteredList(query: string, list: SearchItem[] | undefined): Array<KVSearchResult<SearchItem>> {
  return useMemo(() => (list ? kvSearch.filter(query, list) : []), [query, list]);
}

/**
 * Fetches the resources of the active types and filters them with the query.
 *
 * The search bar is always mounted in the header, so nothing is fetched until the search is enabled (i.e. opened)
 * with a non-empty query. Lists are kept in cache afterward and are only fetched again when invalidated.
 */
export function useSearchResults(query: string, activeTypes: Set<ResourceType>, enabled: boolean): SearchResults {
  const isSearching = enabled && query.trim().length > 0;
  const isActive = (type: ResourceType): boolean => isSearching && activeTypes.has(type);
  const isProjectDatasourceEnabled = useIsProjectDatasourceEnabled();
  const importantDashboardGroups = useImportantDashboardGroups();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();

  // Dashboards and datasources are also needed to display the counts next to the project results.
  const dashboards = useDashboardList({
    metadataOnly: true,
    staleTime: Infinity,
    enabled: isActive('dashboards') || isActive('projects'),
  });
  const projects = useProjectList({ staleTime: Infinity, enabled: isActive('projects') });
  const globalDatasources = useGlobalDatasourceList({ staleTime: Infinity, enabled: isActive('globalDatasources') });
  const datasources = useDatasourceList({
    staleTime: Infinity,
    enabled: isActive('datasources') || (isActive('projects') && isProjectDatasourceEnabled),
  });

  const highlightedDashboards = useMemo((): HighlightedDashboardResource[] => {
    const importantDashboardKeys = new Set(
      resolveImportantDashboardList(dashboards.data ?? [], importantDashboardGroups, shouldNormalizeResourceNames).map(
        ({ metadata }) => `${metadata.project}/${metadata.name}`,
      ),
    );
    return (dashboards.data ?? []).map((dashboard) => ({
      ...dashboard,
      highlight: importantDashboardKeys.has(`${dashboard.metadata.project}/${dashboard.metadata.name}`),
    }));
  }, [dashboards.data, importantDashboardGroups, shouldNormalizeResourceNames]);

  const dashboardResults = useFilteredList(query, isActive('dashboards') ? highlightedDashboards : undefined);
  const projectResults = useFilteredList(query, isActive('projects') ? projects.data : undefined);
  const globalDatasourceResults = useFilteredList(
    query,
    isActive('globalDatasources') ? globalDatasources.data : undefined,
  );
  const datasourceResults = useFilteredList(query, isActive('datasources') ? datasources.data : undefined);

  const dashboardCounts = useMemo(() => countByProject(dashboards.data), [dashboards.data]);
  const datasourceCounts = useMemo(() => countByProject(datasources.data), [datasources.data]);

  const sections: SearchResultSection[] = [
    { type: 'dashboards', results: dashboardResults, isLoading: dashboards.isLoading, error: dashboards.error },
    { type: 'projects', results: projectResults, isLoading: projects.isLoading, error: projects.error },
    {
      type: 'globalDatasources',
      results: globalDatasourceResults,
      isLoading: globalDatasources.isLoading,
      error: globalDatasources.error,
    },
    { type: 'datasources', results: datasourceResults, isLoading: datasources.isLoading, error: datasources.error },
  ];

  return { sections: sections.filter(({ type }) => isActive(type)), dashboardCounts, datasourceCounts };
}
