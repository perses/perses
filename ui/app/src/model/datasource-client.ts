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

import { ProjectDatasource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT, HTTPMethodDELETE, HTTPHeader } from './http';
import buildQueryKey from './querykey-builder';
import buildURL from './url-builder';
import { fetch, fetchJson } from './fetch';

export const resource = 'datasources';

export function buildDatasourceQueryParameters(kind?: string, defaultDatasource?: boolean, name?: string) {
  const q = new URLSearchParams();
  if (kind !== undefined) {
    q.append('kind', kind);
  }
  if (defaultDatasource !== undefined) {
    q.append('default', String(defaultDatasource));
  }
  if (name !== undefined) {
    q.append('name', name);
  }
  return q;
}

export function fetchDatasourceList(project: string, kind?: string, defaultDatasource?: boolean, name?: string) {
  const url = buildURL({
    resource: resource,
    project: project,
    queryParams: buildDatasourceQueryParameters(kind, defaultDatasource, name),
  });
  return fetchJson<ProjectDatasource[]>(url);
}

/**
 * Used to create a new project datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useCreateDatasourceMutation(projectName: string) {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<ProjectDatasource, Error, ProjectDatasource>({
    mutationKey: key,
    mutationFn: (datasource: ProjectDatasource) => {
      return createDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries(key);
    },
  });
}

/**
 * Used to update a project datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useUpdateDatasourceMutation(projectName: string) {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<ProjectDatasource, Error, ProjectDatasource>({
    mutationKey: key,
    mutationFn: (datasource: ProjectDatasource) => {
      return updateDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries(key);
    },
  });
}

/**
 * Used to delete a datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useDeleteDatasourceMutation(projectName: string) {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<ProjectDatasource, Error, ProjectDatasource>({
    mutationKey: key,
    mutationFn: (entity: ProjectDatasource) => {
      return deleteDatasource(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (datasource) => {
      queryClient.removeQueries([...key, datasource.metadata.name]);
      return queryClient.invalidateQueries(key);
    },
  });
}

/**
 * Used to get a datasource in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasource(project: string, name: string) {
  return useQuery<ProjectDatasource, Error>(buildQueryKey({ resource, parent: project, name }), () => {
    return getDatasource(project, name);
  });
}

/**
 * Used to get datasources in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasourceList(project?: string, refetchOnMount = true) {
  return useQuery<ProjectDatasource[], Error>(
    buildQueryKey({ resource, parent: project }),
    () => {
      return getDatasources(project);
    },
    { refetchOnMount: refetchOnMount }
  );
}

export function createDatasource(entity: ProjectDatasource) {
  const url = buildURL({ resource, project: entity.metadata.project });
  return fetchJson<ProjectDatasource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getDatasource(project: string, name: string) {
  const url = buildURL({ resource, project: project, name: name });
  return fetchJson<ProjectDatasource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getDatasources(project?: string) {
  const url = buildURL({ resource, project: project });
  return fetchJson<ProjectDatasource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDatasource(entity: ProjectDatasource) {
  const url = buildURL({ resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<ProjectDatasource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDatasource(entity: ProjectDatasource) {
  const url = buildURL({ resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
