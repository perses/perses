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

import { fetch, fetchJson, Metadata } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodPOST } from './http';
import { resource as dashboardResource } from './dashboard-client';

const resource = 'projects';

export interface ProjectModel {
  kind: 'Project';
  metadata: Metadata;
}

type ProjectListOptions = Omit<UseQueryOptions<ProjectModel[], Error>, 'queryKey' | 'queryFn'>;

/**
 * Gets version information from the Perses server API.
 */
export function useProjectList(options?: ProjectListOptions) {
  return useQuery<ProjectModel[], Error>(
    [resource],
    () => {
      const url = buildURL({ resource });
      return fetchJson<ProjectModel[]>(url);
    },
    options
  );
}

/**
 * Used to create a project in the API
 *
 * Will automatically invalidate the project list and force get query to be executed again.
 *
 * @example:
 * const addProjectMutation = useAddProjectMutation()
 * // ...
 * addProjectMutation.mutate("MyProjectName")
 */
export function useAddProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<ProjectModel, Error, string>({
    mutationKey: [resource],
    mutationFn: (name: string) => {
      const url = buildURL({ resource });
      return fetchJson<ProjectModel>(url, {
        method: HTTPMethodPOST,
        headers: HTTPHeader,
        body: JSON.stringify({ kind: 'Project', metadata: { name } }),
      });
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to remove a project from the API
 *
 * Will automatically invalidate the project list and force get query to be executed again.
 *
 * @example:
 * const deleteProjectMutation = useDeleteProjectMutation()
 * // ...
 * deleteProjectMutation.mutate("MyProjectName")
 */
export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation<string, Error, string>({
    mutationKey: [resource],
    mutationFn: (name: string) => {
      const url = buildURL({ resource, name });
      return fetch(url, {
        method: HTTPMethodDELETE,
        headers: HTTPHeader,
      }).then(() => {
        return name;
      });
    },
    onSuccess: (name) => {
      queryClient.removeQueries([resource, name]);
      queryClient.removeQueries([dashboardResource, name]);

      return Promise.all([
        queryClient.invalidateQueries([dashboardResource]),
        queryClient.invalidateQueries([resource]),
      ]);
    },
  });
}
