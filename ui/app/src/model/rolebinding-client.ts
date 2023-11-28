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

import { fetch, fetchJson, RoleBindingResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';

export const resource = 'rolebindings';

export function createRoleBinding(entity: RoleBindingResource) {
  const project = entity.metadata.project;
  const url = buildURL({ resource, project });
  return fetchJson<RoleBindingResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getRoleBinding(name: string, project: string) {
  const url = buildURL({ resource, project, name });
  return fetchJson<RoleBindingResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getRoleBindings(project?: string) {
  const url = buildURL({ resource, project });
  return fetchJson<RoleBindingResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateRoleBinding(entity: RoleBindingResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetchJson<RoleBindingResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteRoleBinding(entity: RoleBindingResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a roleBinding from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useRoleBinding(name: string, project: string) {
  return useQuery<RoleBindingResource, Error>(buildQueryKey({ resource, name, parent: project }), () => {
    return getRoleBinding(name, project);
  });
}

/**
 * Used to get roleBindings from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useRoleBindingList(project?: string) {
  return useQuery<RoleBindingResource[], Error>(buildQueryKey({ resource, parent: project }), () => {
    return getRoleBindings(project);
  });
}

/**
 * Returns a mutation that can be used to create a roleBinding.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useCreateRoleBindingMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<RoleBindingResource, Error, RoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: (roleBinding: RoleBindingResource) => {
      return createRoleBinding(roleBinding);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([...queryKey]);
    },
  });
}

/**
 * Returns a mutation that can be used to update a roleBinding.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useUpdateRoleBindingMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  return useMutation<RoleBindingResource, Error, RoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: (roleBinding: RoleBindingResource) => {
      return updateRoleBinding(roleBinding);
    },
    onSuccess: (entity: RoleBindingResource) => {
      return Promise.all([
        queryClient.invalidateQueries([...queryKey, entity.metadata.name]),
        queryClient.invalidateQueries(queryKey),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a roleBinding.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useDeleteRoleBindingMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<RoleBindingResource, Error, RoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: RoleBindingResource) => {
      await deleteRoleBinding(entity);
      return entity;
    },
    onSuccess: (entity: RoleBindingResource) => {
      queryClient.removeQueries([...queryKey, entity.metadata.name]);
      return queryClient.invalidateQueries(queryKey);
    },
  });
}
