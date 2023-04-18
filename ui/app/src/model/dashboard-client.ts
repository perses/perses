// Copyright 2023 The Perses Authors
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardResource, fetch, fetchJson } from '@perses-dev/core';
import { useMemo } from 'react';
import { useNavHistory } from '../context/DashboardNavHistory';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildURL from './url-builder';

const resource = 'dashboards';

/**
 * Used to create a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useCreateDashboardMutation(
  onSuccess?: (data: DashboardResource, variables: DashboardResource) => Promise<unknown> | unknown
) {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return createDashboard(dashboard);
    },
    onSuccess: onSuccess,
    onSettled: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to get a dashboard in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboard(project: string, name: string) {
  return useQuery<DashboardResource, Error>([resource, project, name], () => {
    return getDashboard(project, name);
  });
}

/**
 * Used to get dashboards in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboardList(project?: string) {
  return useQuery<DashboardResource[], Error>([resource, project], () => {
    return getDashboards(project);
  });
}

export interface DatedDashboards {
  dashboard: DashboardResource;
  date: string;
}

/**
 * Used to get dashboards seen recently by the user.
 * Will automatically be refreshed when cache is invalidated or history modified
 */
export function useRecentDashboardList(project?: string) {
  const { data } = useDashboardList(project);
  const history = useNavHistory();

  return useMemo(() => {
    // Wrapping dashboard with their last seen date from nav history context
    const result: DatedDashboards[] = [];

    // Iterating with history first to keep history order in the result
    (history || []).forEach((historyItem) => {
      const dashboard = (data || []).find(
        (dashboard) =>
          historyItem.project === dashboard.metadata.project && historyItem.name === dashboard.metadata.name
      );
      if (dashboard) {
        result.push({ dashboard: dashboard, date: historyItem.date });
      }
    });

    return result;
  }, [data, history]);
}

/**
 * Used to update a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useUpdateDashboardMutation() {
  const queryClient = useQueryClient();

  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      return updateDashboard(dashboard);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to delete a dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useDeleteDashboardMutation() {
  const queryClient = useQueryClient();
  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (entity: DashboardResource) => {
      return deleteDashboard(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (dashboard) => {
      queryClient.removeQueries([resource, dashboard.metadata.project, dashboard.metadata.name]);
      return queryClient.invalidateQueries([resource]);
    },
  });
}

export function createDashboard(entity: DashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getDashboard(project: string, name: string) {
  const url = buildURL({ resource: resource, project: project, name: name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getDashboards(project?: string) {
  const url = buildURL({ resource: resource, project: project });
  return fetchJson<DashboardResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDashboard(entity: DashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<DashboardResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDashboard(entity: DashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
