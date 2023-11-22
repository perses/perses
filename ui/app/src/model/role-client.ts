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

import { fetch, fetchJson, RoleResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';

export const resource = 'roles';

export function createRole(entity: RoleResource) {
  const project = entity.metadata.project;
  const url = buildURL({ resource, project });
  return fetchJson<RoleResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getRole(name: string, project: string) {
  const url = buildURL({ resource, project, name });
  return fetchJson<RoleResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getRoles(project?: string) {
  const url = buildURL({ resource, project });
  return fetchJson<RoleResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateRole(entity: RoleResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetchJson<RoleResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteRole(entity: RoleResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a role from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useRole(name: string, project: string) {
  return useQuery<RoleResource, Error>(buildQueryKey({ resource, name, parent: project }), () => {
    return getRole(name, project);
  });
}

/**
 * Used to get roles from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useRoleList(project?: string) {
  return useQuery<RoleResource[], Error>(buildQueryKey({ resource, parent: project }), () => {
    return getRoles(project);
  });
}

/**
 * Returns a mutation that can be used to create a role.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useCreateRoleMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<RoleResource, Error, RoleResource>({
    mutationKey: queryKey,
    mutationFn: (role: RoleResource) => {
      return createRole(role);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([...queryKey]);
    },
  });
}

/**
 * Returns a mutation that can be used to update a role.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useUpdateRoleMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  return useMutation<RoleResource, Error, RoleResource>({
    mutationKey: queryKey,
    mutationFn: (role: RoleResource) => {
      return updateRole(role);
    },
    onSuccess: (entity: RoleResource) => {
      return Promise.all([
        queryClient.invalidateQueries([...queryKey, entity.metadata.name]),
        queryClient.invalidateQueries(queryKey),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a role.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useDeleteRoleMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<RoleResource, Error, RoleResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: RoleResource) => {
      await deleteRole(entity);
      return entity;
    },
    onSuccess: (entity: RoleResource) => {
      queryClient.removeQueries([...queryKey, entity.metadata.name]);
      return queryClient.invalidateQueries(queryKey);
    },
  });
}
