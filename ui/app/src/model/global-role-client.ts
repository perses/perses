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

import { fetch, fetchJson, GlobalRoleResource } from '@perses-dev/core';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';

export const resource = 'globalroles';

export function createGlobalRole(entity: GlobalRoleResource): Promise<GlobalRoleResource> {
  const url = buildURL({ resource });
  return fetchJson<GlobalRoleResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getGlobalRole(name: string): Promise<GlobalRoleResource> {
  const url = buildURL({ resource, name });
  return fetchJson<GlobalRoleResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function globalRoleClient(): Promise<GlobalRoleResource[]> {
  const url = buildURL({ resource });
  return fetchJson<GlobalRoleResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalRole(entity: GlobalRoleResource): Promise<GlobalRoleResource> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<GlobalRoleResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalRole(entity: GlobalRoleResource): Promise<Response> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a globalRole from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalRole(name: string): UseQueryResult<GlobalRoleResource> {
  return useQuery<GlobalRoleResource, Error>({
    queryKey: buildQueryKey({ resource, name }),
    queryFn: () => {
      return getGlobalRole(name);
    },
  });
}

/**
 * Used to get globalRoles from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalRoleList(): UseQueryResult<GlobalRoleResource[]> {
  return useQuery<GlobalRoleResource[], Error>({
    queryKey: buildQueryKey({ resource }),
    queryFn: () => {
      return globalRoleClient();
    },
  });
}

/**
 * Returns a mutation that can be used to create a globalRole.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateGlobalRoleMutation(): UseMutationResult<GlobalRoleResource, Error, GlobalRoleResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalRoleResource, Error, GlobalRoleResource>({
    mutationKey: queryKey,
    mutationFn: (globalRole: GlobalRoleResource) => {
      return createGlobalRole(globalRole);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [...queryKey] });
    },
  });
}

/**
 * Returns a mutation that can be used to update a globalRole.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateGlobalRoleMutation(): UseMutationResult<GlobalRoleResource, Error, GlobalRoleResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });
  return useMutation<GlobalRoleResource, Error, GlobalRoleResource>({
    mutationKey: queryKey,
    mutationFn: (globalRole: GlobalRoleResource) => {
      return updateGlobalRole(globalRole);
    },
    onSuccess: (entity: GlobalRoleResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a globalRole.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteGlobalRoleMutation(): UseMutationResult<GlobalRoleResource, Error, GlobalRoleResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalRoleResource, Error, GlobalRoleResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: GlobalRoleResource) => {
      await deleteGlobalRole(entity);
      return entity;
    },
    onSuccess: (entity: GlobalRoleResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
