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

import { DatasourceResource, fetchJson, StatusError } from '@perses-dev/core';
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';
import { useActiveUser } from './auth-client';

export const resource = 'datasources';

type DatasourceListOptions = Omit<UseQueryOptions<DatasourceResource[], StatusError>, 'queryKey' | 'queryFn'> & {
  project?: string;
};

export function createDatasource(owner: string | undefined, entity: DatasourceResource): Promise<DatasourceResource> {
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, owner });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getDatasource(owner: string | undefined, name: string, project: string): Promise<DatasourceResource> {
  const url = buildURL({ resource, project, name, owner });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getDatasources(owner: string | undefined, project?: string): Promise<DatasourceResource[]> {
  const url = buildURL({ resource, project, owner });
  return fetchJson<DatasourceResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateDatasource(owner: string | undefined, entity: DatasourceResource): Promise<DatasourceResource> {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name, owner });
  return fetchJson<DatasourceResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteDatasource(owner: string | undefined, entity: DatasourceResource): Promise<Response> {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name, owner });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a datasource from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasource(name: string, project: string): UseQueryResult<DatasourceResource, StatusError> {
  const owner = useActiveUser();

  return useQuery<DatasourceResource, StatusError>({
    queryKey: buildQueryKey({ resource, name, parent: project }),
    queryFn: () => {
      return getDatasource(owner, name, project);
    },
  });
}

/**
 * Used to get datasources from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useDatasourceList(options: DatasourceListOptions): UseQueryResult<DatasourceResource[], StatusError> {
  const owner = useActiveUser();

  return useQuery<DatasourceResource[], StatusError>({
    queryKey: buildQueryKey({ resource, parent: options.project }),
    queryFn: () => {
      return getDatasources(owner, options.project);
    },
    enabled: !!owner,
    ...options,
  });
}

/**
 * Returns a mutation that can be used to create a datasource.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useCreateDatasourceMutation(
  project: string
): UseMutationResult<DatasourceResource, StatusError, DatasourceResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  const owner = useActiveUser();

  return useMutation<DatasourceResource, StatusError, DatasourceResource>({
    mutationKey: queryKey,
    mutationFn: (datasource: DatasourceResource) => {
      return createDatasource(owner, datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [...queryKey] });
    },
  });
}

/**
 * Returns a mutation that can be used to update a datasource.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useUpdateDatasourceMutation(
  project: string
): UseMutationResult<DatasourceResource, StatusError, DatasourceResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  const owner = useActiveUser();

  return useMutation<DatasourceResource, StatusError, DatasourceResource>({
    mutationKey: queryKey,
    mutationFn: (datasource: DatasourceResource) => {
      return updateDatasource(owner, datasource);
    },
    onSuccess: (entity: DatasourceResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a datasource.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useDeleteDatasourceMutation(
  project: string
): UseMutationResult<DatasourceResource, StatusError, DatasourceResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  const owner = useActiveUser();

  return useMutation<DatasourceResource, StatusError, DatasourceResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: DatasourceResource) => {
      await deleteDatasource(owner, entity);
      return entity;
    },
    onSuccess: (entity: DatasourceResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
