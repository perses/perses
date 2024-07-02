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

import { GlobalDatasourceResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { fetch, fetchJson } from './fetch';

const globalDatasourceResource = 'globaldatasources';

/**
 * Used to create a new global datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useCreateGlobalDatasourceMutation() {
  const queryClient = useQueryClient();

  return useMutation<GlobalDatasourceResource, Error, GlobalDatasourceResource>({
    mutationKey: [globalDatasourceResource],
    mutationFn: (datasource: GlobalDatasourceResource) => {
      return createGlobalDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([globalDatasourceResource]);
    },
  });
}

/**
 * Used to update a global datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useUpdateGlobalDatasourceMutation() {
  const queryClient = useQueryClient();

  return useMutation<GlobalDatasourceResource, Error, GlobalDatasourceResource>({
    mutationKey: [globalDatasourceResource],
    mutationFn: (datasource: GlobalDatasourceResource) => {
      return updateGlobalDatasource(datasource);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([globalDatasourceResource]);
    },
  });
}

/**
 * Used to delete a global datasource in the API.
 * Will automatically invalidate datasources and force the get query to be executed again.
 */
export function useDeleteGlobalDatasourceMutation() {
  const queryClient = useQueryClient();
  return useMutation<GlobalDatasourceResource, Error, GlobalDatasourceResource>({
    mutationKey: [globalDatasourceResource],
    mutationFn: (entity: GlobalDatasourceResource) => {
      return deleteGlobalDatasource(entity).then(() => {
        return entity;
      });
    },
    onSuccess: (datasource) => {
      queryClient.removeQueries([globalDatasourceResource, datasource.metadata.name]);
      return queryClient.invalidateQueries([globalDatasourceResource]);
    },
  });
}

/**
 * Used to get a global datasource from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalDatasource(name: string) {
  return useQuery<GlobalDatasourceResource, Error>([globalDatasourceResource, name], () => {
    return getGlobalDatasource(name);
  });
}

/**
 * Used to get global datasources from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalDatasourceList() {
  return useQuery<GlobalDatasourceResource[], Error>([globalDatasourceResource], () => {
    return getGlobalDatasources();
  });
}

export function createGlobalDatasource(entity: GlobalDatasourceResource) {
  const url = buildURL({ resource: globalDatasourceResource });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function getGlobalDatasource(name: string) {
  const url = buildURL({ resource: globalDatasourceResource, name: name });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getGlobalDatasources() {
  const url = buildURL({ resource: globalDatasourceResource });
  return fetchJson<GlobalDatasourceResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalDatasource(entity: GlobalDatasourceResource) {
  const url = buildURL({ resource: globalDatasourceResource, name: entity.metadata.name });
  return fetchJson<GlobalDatasourceResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalDatasource(entity: GlobalDatasourceResource) {
  const url = buildURL({ resource: globalDatasourceResource, name: entity.metadata.name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}
