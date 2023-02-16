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
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodPOST, HTTPMethodPUT } from './http';

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
    const url = buildURL({ resource: resource, name: name, project: project });
    return fetchJson<DashboardResource>(url);
  });
}

/**
 * Used to get dashboards in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDashboardList(project?: string) {
  return useQuery<DashboardResource[], Error>([resource, project], () => {
    const url = buildURL({ resource: resource, project: project });
    return fetchJson<DashboardResource[]>(url);
  });
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
