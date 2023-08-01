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

import { fetch, fetchJson, ProjectResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodPOST } from './http';
import { resource as dashboardResource } from './dashboard-client';
import { resource as variableResource } from './variable-client';
import { resource as datasourceResource } from './datasource-client';
import buildQueryKey from './querykey-builder';

const resource = 'projects';

/**
 * List the resources that are under project, to invalidate their cache on project deletion.
 */
const dependingResources = [dashboardResource, variableResource, datasourceResource];

type ProjectListOptions = Omit<UseQueryOptions<ProjectResource[], Error>, 'queryKey' | 'queryFn'>;

/**
 * Used to get projects from the API
 * Will automatically be refreshed when cache is invalidated
 */
export function useProjectList(options?: ProjectListOptions) {
  const key = buildQueryKey({ resource });
  return useQuery<ProjectResource[], Error>(
    key,
    () => {
      const url = buildURL({ resource });
      return fetchJson<ProjectResource[]>(url);
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
  const key = buildQueryKey({ resource });
  return useMutation<ProjectResource, Error, string>({
    mutationKey: key,
    mutationFn: (name: string) => {
      const url = buildURL({ resource });
      return fetchJson<ProjectResource>(url, {
        method: HTTPMethodPOST,
        headers: HTTPHeader,
        body: JSON.stringify({ kind: 'Project', metadata: { name } }),
      });
    },
    onSuccess: () => {
      return queryClient.invalidateQueries(key);
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
  const key = buildQueryKey({ resource });

  return useMutation<string, Error, string>({
    mutationKey: key,
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

      const dependingKeys = dependingResources.map((resource) => buildQueryKey({ resource, parent: name }));
      dependingKeys.forEach((k) => queryClient.removeQueries(k));

      return Promise.all([
        ...dependingKeys.map((k) => queryClient.invalidateQueries(k)),
        queryClient.invalidateQueries(key),
      ]);
    },
  });
}
