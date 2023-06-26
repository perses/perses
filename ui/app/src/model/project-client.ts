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

import { fetch, fetchJson, ProjectResource, VariableResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { resource as dashboardResource } from './dashboard-client';

const resource = 'projects';
const variableResource = 'variables';

type ProjectListOptions = Omit<UseQueryOptions<ProjectResource[], Error>, 'queryKey' | 'queryFn'>;

/**
 * Gets version information from the Perses server API.
 */
export function useProjectList(options?: ProjectListOptions) {
  return useQuery<ProjectResource[], Error>(
    [resource],
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
  return useMutation<ProjectResource, Error, string>({
    mutationKey: [resource],
    mutationFn: (name: string) => {
      const url = buildURL({ resource });
      return fetchJson<ProjectResource>(url, {
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

export function useCreateVariableMutation(projectName: string) {
  const queryClient = useQueryClient();

  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: [resource, projectName, variableResource],
    mutationFn: (variable: VariableResource) => {
      return createVariable(variable);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to get a dashboard in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useVariable(projectName: string, name: string) {
  return useQuery<VariableResource, Error>([resource, projectName, variableResource, name], () => {
    return getVariable(projectName, name);
  });
}

/**
 * Used to get dashboards in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useVariableList(projectName: string) {
  return useQuery<VariableResource[], Error>([resource, projectName, variableResource], () => {
    return getVariables(projectName);
  });
}

export function useUpdateVariableMutation(projectName: string) {
  const queryClient = useQueryClient();

  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: [resource, projectName, variableResource],
    mutationFn: (variable: VariableResource) => {
      return updateVariable(variable);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource, projectName, variableResource]);
    },
  });
}

export function useDeleteVariableMutation(projectName: string) {
  const queryClient = useQueryClient();

  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: [resource, projectName, variableResource],
    mutationFn: (entity: VariableResource) => {
      return deleteVariable(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (variable) => {
      queryClient.removeQueries([resource, projectName, variableResource, variableResource, variable.metadata.name]);
      return queryClient.invalidateQueries([resource, projectName, variableResource]);
    },
  });
}

export function createVariable(entity: VariableResource) {
  const url = buildURL({ resource: variableResource, project: entity.metadata.project });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getVariable(project: string, name: string) {
  const url = buildURL({ resource: variableResource, project: project, name: name });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getVariables(project?: string) {
  const url = buildURL({ resource: variableResource, project: project });
  return fetchJson<VariableResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateVariable(entity: VariableResource) {
  const url = buildURL({ resource: variableResource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteVariable(entity: VariableResource) {
  const url = buildURL({ resource: variableResource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
