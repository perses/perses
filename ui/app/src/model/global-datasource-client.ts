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
//
import { fetch, fetchJson, GlobalDatasourceResource, StatusError } from '@perses-dev/core';
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
import buildQueryKey from './querykey-builder';

export const resource = 'globaldatasources';

type GlobalDatasourceListOptions = Omit<
  UseQueryOptions<GlobalDatasourceResource[], StatusError>,
  'queryKey' | 'queryFn'
>;

export function createGlobalDatasource(entity: GlobalDatasourceResource): Promise<GlobalDatasourceResource> {
  const url = buildURL({ resource });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getGlobalDatasource(name: string): Promise<GlobalDatasourceResource> {
  const url = buildURL({ resource, name });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function globalDatasourceClient(): Promise<GlobalDatasourceResource[]> {
  const url = buildURL({ resource });
  return fetchJson<GlobalDatasourceResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalDatasource(entity: GlobalDatasourceResource): Promise<GlobalDatasourceResource> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalDatasource(entity: GlobalDatasourceResource): Promise<Response> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a globalDatasource from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalDatasource(name: string): UseQueryResult<GlobalDatasourceResource, StatusError> {
  return useQuery<GlobalDatasourceResource, StatusError>({
    queryKey: buildQueryKey({ resource, name }),
    queryFn: () => {
      return getGlobalDatasource(name);
    },
  });
}

/**
 * Used to get globalDatasources from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalDatasourceList(
  options?: GlobalDatasourceListOptions
): UseQueryResult<GlobalDatasourceResource[], StatusError> {
  return useQuery<GlobalDatasourceResource[], StatusError>({
    queryKey: buildQueryKey({ resource }),
    queryFn: () => {
      return globalDatasourceClient();
    },
    ...options,
  });
}

/**
 * Returns a mutation that can be used to create a globalDatasource.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateGlobalDatasourceMutation(): UseMutationResult<
  GlobalDatasourceResource,
  StatusError,
  GlobalDatasourceResource
> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalDatasourceResource, StatusError, GlobalDatasourceResource>({
    mutationKey: queryKey,
    mutationFn: (globalDatasource: GlobalDatasourceResource) => {
      return createGlobalDatasource(globalDatasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [...queryKey] });
    },
  });
}

/**
 * Returns a mutation that can be used to update a globalDatasource.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateGlobalDatasourceMutation(): UseMutationResult<
  GlobalDatasourceResource,
  StatusError,
  GlobalDatasourceResource
> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });
  return useMutation<GlobalDatasourceResource, StatusError, GlobalDatasourceResource>({
    mutationKey: queryKey,
    mutationFn: (globalDatasource: GlobalDatasourceResource) => {
      return updateGlobalDatasource(globalDatasource);
    },
    onSuccess: (entity: GlobalDatasourceResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a globalDatasource.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteGlobalDatasourceMutation(): UseMutationResult<
  GlobalDatasourceResource,
  StatusError,
  GlobalDatasourceResource
> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalDatasourceResource, StatusError, GlobalDatasourceResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: GlobalDatasourceResource) => {
      await deleteGlobalDatasource(entity);
      return entity;
    },
    onSuccess: (entity: GlobalDatasourceResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
