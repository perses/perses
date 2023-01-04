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

import { useMutation, useQuery } from '@tanstack/react-query';
import { DashboardResource, fetchJson } from '@perses-dev/core';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodPOST, HTTPMethodPUT } from './http';

const resource = 'dashboards';

export function useCreateDashboard(
  onSuccess?: (data: DashboardResource, variables: DashboardResource) => Promise<unknown> | unknown
) {
  return useMutation<DashboardResource, Error, DashboardResource>({
    mutationKey: [resource],
    mutationFn: (dashboard) => {
      const url = buildURL({ resource: resource, project: dashboard.metadata.project });
      return fetchJson<DashboardResource>(url, {
        method: HTTPMethodPOST,
        headers: HTTPHeader,
        body: JSON.stringify(dashboard),
      });
    },
    onSuccess: onSuccess,
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

export function useDashboard(project: string, name: string) {
  return useQuery<DashboardResource, Error>([resource, project, name], () => {
    const url = buildURL({ resource: resource, name: name, project: project });
    return fetchJson<DashboardResource>(url);
  });
}

export function useDashboardList(project?: string) {
  return useQuery<DashboardResource[], Error>([resource, project], () => {
    const url = buildURL({ resource: resource, project: project });
    return fetchJson<DashboardResource[]>(url);
  });
}
