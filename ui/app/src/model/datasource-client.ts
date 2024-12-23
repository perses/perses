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

import { DatasourceResource } from '@perses-dev/core';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT, HTTPMethodDELETE, HTTPHeader } from './http';
import buildQueryKey from './querykey-builder';
import buildURL from './url-builder';
import { fetch, fetchJson } from './fetch';

export const resource = 'datasources';

type DatasourceListOptions = Omit<UseQueryOptions<DatasourceResource[], Error>, 'queryKey' | 'queryFn'> & {
  project?: string;
};

export function buildDatasourceQueryParameters(
  kind?: string,
  defaultDatasource?: boolean,
  name?: string
): URLSearchParams {
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

export function fetchDatasourceList(
  project: string,
  kind?: string,
  defaultDatasource?: boolean,
  name?: string
): Promise<DatasourceResource[]> {
  const url = buildURL({
    resource: resource,
    project: project,
    queryParams: buildDatasourceQueryParameters(kind, defaultDatasource, name),
  });
  return fetchJson<DatasourceResource[]>(url);
}

/**
 * Used to create a new project datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useCreateDatasourceMutation(
  projectName: string
): UseMutationResult<DatasourceResource, Error, DatasourceResource> {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<DatasourceResource, Error, DatasourceResource>({
    mutationKey: key,
    mutationFn: (datasource: DatasourceResource) => {
      return createDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Used to update a project datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useUpdateDatasourceMutation(
  projectName: string
): UseMutationResult<DatasourceResource, Error, DatasourceResource> {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<DatasourceResource, Error, DatasourceResource>({
    mutationKey: key,
    mutationFn: (datasource: DatasourceResource) => {
      return updateDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Used to delete a datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useDeleteDatasourceMutation(
  projectName: string
): UseMutationResult<DatasourceResource, Error, DatasourceResource> {
  const queryClient = useQueryClient();
  const key = buildQueryKey({ resource, parent: projectName });

  return useMutation<DatasourceResource, Error, DatasourceResource>({
    mutationKey: key,
    mutationFn: (entity: DatasourceResource) => {
      return deleteDatasource(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (datasource) => {
      queryClient.removeQueries({ queryKey: [...key, datasource.metadata.name] });
      return queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/**
 * Used to get a datasource in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasource(project: string, name: string): UseQueryResult<DatasourceResource> {
  return useQuery<DatasourceResource, Error>({
    queryKey: buildQueryKey({ resource, parent: project, name }),
    queryFn: () => {
      return getDatasource(project, name);
    },
  });
}

/**
 * Used to get datasources in the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasourceList(options: DatasourceListOptions): UseQueryResult<DatasourceResource[]> {
  return useQuery<DatasourceResource[], Error>({
    queryKey: buildQueryKey({ resource, parent: options.project }),
    queryFn: () => {
      return getDatasources(options.project);
    },
    ...options,
  });
}

export function createDatasource(entity: DatasourceResource): Promise<DatasourceResource> {
  const url = buildURL({ resource, project: entity.metadata.project });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getDatasource(project: string, name: string): Promise<DatasourceResource> {
  const url = buildURL({ resource, project: project, name: name });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getDatasources(project?: string): Promise<DatasourceResource[]> {
  const url = buildURL({ resource, project: project });
  return fetchJson<DatasourceResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDatasource(entity: DatasourceResource): Promise<DatasourceResource> {
  const url = buildURL({ resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDatasource(entity: DatasourceResource): Promise<Response> {
  const url = buildURL({ resource, project: entity.metadata.project, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
