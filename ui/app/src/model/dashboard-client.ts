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

import type { DashboardResource, StatusError } from '@perses-dev/client';
import { fetchJson } from '@perses-dev/client';
import type { DashboardSpec } from '@perses-dev/spec';
import type { UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useImportantDashboardGroups, useShouldNormalizeResourceNames } from '../context/Config';
import { useNavHistory } from '../context/DashboardNavHistory';
import type { ImportantDashboardGroupConfig } from './config-client';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildURL from './url-builder';

export const resource = 'dashboards';

type DashboardOptions = Omit<UseQueryOptions<DashboardResource, StatusError>, 'queryKey' | 'queryFn'>;

type DashboardListOptions = Omit<UseQueryOptions<DashboardResource[], StatusError>, 'queryKey' | 'queryFn'> & {
  project?: string;
  metadataOnly?: boolean;
};

/**
 * Used to create a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useCreateDashboardMutation(
  onSuccess?: (data: DashboardResource, variables: DashboardResource) => Promise<unknown> | unknown,
): UseMutationResult<DashboardResource, StatusError, DashboardResource> {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, StatusError, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return createDashboard(dashboard);
    },
    onSuccess: onSuccess,
    onSettled: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * Used to get a dashboard in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboard(
  project: string,
  name: string,
  options?: DashboardOptions,
): UseQueryResult<DashboardResource, StatusError> {
  return useQuery<DashboardResource, StatusError>({
    queryKey: [resource, project, name],
    queryFn: () => {
      return getDashboard(project, name);
    },
    ...options,
  });
}

/**
 * Used to get dashboards in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboardList(options: DashboardListOptions): UseQueryResult<DashboardResource[], StatusError> {
  return useQuery<DashboardResource[], StatusError>({
    queryKey: [resource, options.project, options.metadataOnly],
    queryFn: () => {
      return getDashboards(options.project, options.metadataOnly);
    },
    ...options,
  });
}

export interface DatedDashboards {
  dashboard: DashboardResource;
  date: string;
}

export interface ImportantDashboardGroupData {
  title?: string;
  description?: string;
  entries: ImportantDashboardEntryData[];
}

export type ImportantDashboardEntryData =
  | {
      kind: 'dashboard';
      dashboard: DashboardResource;
    }
  | {
      kind: 'project';
      project: string;
      dashboards: DashboardResource[];
    };

function normalizeImportantDashboardName(name: string, shouldNormalizeResourceNames: boolean): string {
  return shouldNormalizeResourceNames ? name.toLowerCase() : name;
}

function buildDashboardKey(project: string, dashboard: string, shouldNormalizeResourceNames: boolean): string {
  return `${normalizeImportantDashboardName(project, shouldNormalizeResourceNames)}/${normalizeImportantDashboardName(dashboard, shouldNormalizeResourceNames)}`;
}

export function resolveImportantDashboardList(
  dashboards: DashboardResource[],
  importantDashboardGroups: ImportantDashboardGroupConfig[],
  shouldNormalizeResourceNames: boolean,
): DashboardResource[] {
  const result: DashboardResource[] = [];
  const dashboardsByKey = new Map(
    dashboards.map((dashboard) => [
      buildDashboardKey(dashboard.metadata.project, dashboard.metadata.name, shouldNormalizeResourceNames),
      dashboard,
    ]),
  );
  const dashboardsByProject = new Map<string, DashboardResource[]>();

  dashboards.forEach((dashboard) => {
    const projectKey = normalizeImportantDashboardName(dashboard.metadata.project, shouldNormalizeResourceNames);
    dashboardsByProject.set(projectKey, [...(dashboardsByProject.get(projectKey) ?? []), dashboard]);
  });

  importantDashboardGroups.forEach((group) => {
    (group.dashboards ?? []).forEach((selector) => {
      if (selector.dashboard === undefined) {
        result.push(
          ...(dashboardsByProject.get(
            normalizeImportantDashboardName(selector.project, shouldNormalizeResourceNames),
          ) ?? []),
        );
        return;
      }

      const dashboard = dashboardsByKey.get(
        buildDashboardKey(selector.project, selector.dashboard, shouldNormalizeResourceNames),
      );
      if (dashboard) {
        result.push(dashboard);
      }
    });
  });

  return result;
}

export function resolveImportantDashboardGroups(
  dashboards: DashboardResource[],
  importantDashboardGroups: ImportantDashboardGroupConfig[],
  shouldNormalizeResourceNames: boolean,
): ImportantDashboardGroupData[] {
  const dashboardsByKey = new Map(
    dashboards.map((dashboard) => [
      buildDashboardKey(dashboard.metadata.project, dashboard.metadata.name, shouldNormalizeResourceNames),
      dashboard,
    ]),
  );
  const dashboardsByProject = new Map<string, DashboardResource[]>();

  dashboards.forEach((dashboard) => {
    const projectKey = normalizeImportantDashboardName(dashboard.metadata.project, shouldNormalizeResourceNames);
    dashboardsByProject.set(projectKey, [...(dashboardsByProject.get(projectKey) ?? []), dashboard]);
  });

  return importantDashboardGroups.map((group) => {
    const entries: ImportantDashboardEntryData[] = [];

    (group.dashboards ?? []).forEach((selector) => {
      if (selector.dashboard === undefined) {
        entries.push({
          kind: 'project',
          project: selector.project,
          dashboards:
            dashboardsByProject.get(normalizeImportantDashboardName(selector.project, shouldNormalizeResourceNames)) ??
            [],
        });
        return;
      }

      const dashboard = dashboardsByKey.get(
        buildDashboardKey(selector.project, selector.dashboard, shouldNormalizeResourceNames),
      );
      if (dashboard) {
        entries.push({
          kind: 'dashboard',
          dashboard,
        });
      }
    });

    return {
      title: group.title,
      description: group.description,
      entries,
    };
  });
}

/**
 * Used to get dashboards seen recently by the user.
 * Will automatically be refreshed when cache is invalidated or history modified
 */
export function useRecentDashboardList(
  project?: string,
  maxSize?: number,
): {
  isLoading: false | true;
  data: DatedDashboards[];
} {
  const { data, isLoading } = useDashboardList({ project: project, metadataOnly: true });
  const history = useNavHistory();

  const recentDashboards = useMemo(() => {
    // Wrapping dashboard with their last seen date from nav history context
    const datedDashboards: DatedDashboards[] = [];
    const dashboardsByKey = new Map(
      (data ?? []).map((dashboard) => [`${dashboard.metadata.project}/${dashboard.metadata.name}`, dashboard]),
    );

    // Iterating with history first to keep history order in the result
    (history ?? []).forEach((historyItem) => {
      const dashboard = dashboardsByKey.get(`${historyItem.project}/${historyItem.name}`);
      if (dashboard) {
        datedDashboards.push({ dashboard: dashboard, date: historyItem.date });
      }
    });

    if (maxSize) {
      return datedDashboards.slice(0, maxSize);
    }

    return datedDashboards;
  }, [data, history, maxSize]);

  return { data: recentDashboards, isLoading: isLoading };
}

/**
 * Used to get important dashboards.
 * Will automatically be refreshed when cache is invalidated or history modified
 */
export function useImportantDashboardList(project?: string): {
  isLoading: false | true;
  data: DashboardResource[];
  error: StatusError | null;
} {
  const { data: dashboards, isLoading, error } = useDashboardList({ project: project, metadataOnly: true });
  const importantDashboardGroups = useImportantDashboardGroups();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();

  const importantDashboards = useMemo(() => {
    return resolveImportantDashboardList(dashboards ?? [], importantDashboardGroups, shouldNormalizeResourceNames);
  }, [dashboards, importantDashboardGroups, shouldNormalizeResourceNames]);
  return { data: importantDashboards, isLoading: isLoading, error };
}

export function useImportantDashboardGroupsData(project?: string): {
  isLoading: false | true;
  data: ImportantDashboardGroupData[];
  error: StatusError | null;
} {
  const { data: dashboards, isLoading, error } = useDashboardList({ project: project, metadataOnly: true });
  const importantDashboardGroups = useImportantDashboardGroups();
  const shouldNormalizeResourceNames = useShouldNormalizeResourceNames();

  const importantDashboardGroupData = useMemo(() => {
    return resolveImportantDashboardGroups(dashboards ?? [], importantDashboardGroups, shouldNormalizeResourceNames);
  }, [dashboards, importantDashboardGroups, shouldNormalizeResourceNames]);

  return { data: importantDashboardGroupData, isLoading, error };
}

/**
 * Used to update a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useUpdateDashboardMutation(): UseMutationResult<DashboardResource, Error, DashboardResource> {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return updateDashboard(dashboard);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

/**
 * A dashboard resource with an optional / partial spec.
 * Useful for actions like the deletion that only require the metadata.
 */
export type PartialDashboardResource = Omit<DashboardResource, 'spec'> & { spec?: Partial<DashboardSpec> };

/**
 * Used to delete a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useDeleteDashboardMutation(): UseMutationResult<
  PartialDashboardResource,
  Error,
  PartialDashboardResource
> {
  const queryClient = useQueryClient();
  return useMutation<PartialDashboardResource, Error, PartialDashboardResource>({
    mutationKey: [resource],
    mutationFn: (entity: PartialDashboardResource) => {
      return deleteDashboard(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (dashboard) => {
      queryClient.removeQueries({ queryKey: [resource, dashboard.metadata.project, dashboard.metadata.name] });
      return queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}

export function createDashboard(entity: DashboardResource): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getDashboard(project: string, name: string): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: project, name: name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getDashboards(project?: string, metadataOnly: boolean = false): Promise<DashboardResource[]> {
  const queryParams = new URLSearchParams();
  if (metadataOnly) {
    queryParams.set('metadata_only', 'true');
  }
  const url = buildURL({ resource: resource, project: project, queryParams: queryParams });
  return fetchJson<DashboardResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDashboard(entity: DashboardResource): Promise<DashboardResource> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDashboard(entity: PartialDashboardResource): Promise<Response> {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
