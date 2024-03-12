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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EphemeralDashboardResource } from '@perses-dev/core';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildURL from './url-builder';
import { fetchJson } from './fetch';

export const resource = 'ephemeraldashboards';

/**
 * Used to create an ephemeral dashboard in the API.
 * Will automatically invalidate ephemeral dashboards and force the get query to be executed again.
 */
export function useCreateEphemeralDashboardMutation(
  onSuccess?: (data: EphemeralDashboardResource, variables: EphemeralDashboardResource) => Promise<unknown> | unknown
) {
  const queryClient = useQueryClient();

  return useMutation<EphemeralDashboardResource, Error, EphemeralDashboardResource>({
    mutationKey: [resource],
    mutationFn: (ephemeralDashboard) => {
      return createEphemeralDashboard(ephemeralDashboard);
    },
    onSuccess: onSuccess,
    onSettled: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to update an ephemeral dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useUpdateEphemeralDashboardMutation() {
  const queryClient = useQueryClient();

  return useMutation<EphemeralDashboardResource, Error, EphemeralDashboardResource>({
    mutationKey: [resource],
    mutationFn: (ephemeralDashboard) => {
      return updateEphemeralDashboard(ephemeralDashboard);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to delete an ephemeral dashboard in the API.
 * Will automatically invalidate dashboards and force the get query to be executed again.
 */
export function useDeleteEphemeralDashboardMutation() {
  const queryClient = useQueryClient();
  return useMutation<EphemeralDashboardResource, Error, EphemeralDashboardResource>({
    mutationKey: [resource],
    mutationFn: (entity: EphemeralDashboardResource) => {
      return deleteEphemeralDashboard(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (ephemeralDashboard) => {
      queryClient.removeQueries([resource, ephemeralDashboard.metadata.project, ephemeralDashboard.metadata.name]);
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to get an ephemeral dashboard from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useEphemeralDashboard(project: string, name: string) {
  return useQuery<EphemeralDashboardResource, Error>([resource, project, name], () => {
    return getEphemeralDashboard(project, name);
  });
}

/**
 * Used to get ephemeral dashboards from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useEphemeralDashboardList(project?: string) {
  return useQuery<EphemeralDashboardResource[], Error>([resource, project], () => {
    return getEphemeralDashboards(project);
  });
}

export function createEphemeralDashboard(entity: EphemeralDashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project });
  return fetchJson<EphemeralDashboardResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getEphemeralDashboard(project: string, name: string) {
  const url = buildURL({ resource: resource, project: project, name: name });
  return fetchJson<EphemeralDashboardResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getEphemeralDashboards(project?: string) {
  const url = buildURL({ resource: resource, project: project });
  return fetchJson<EphemeralDashboardResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateEphemeralDashboard(entity: EphemeralDashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<EphemeralDashboardResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteEphemeralDashboard(entity: EphemeralDashboardResource) {
  const url = buildURL({ resource: resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
