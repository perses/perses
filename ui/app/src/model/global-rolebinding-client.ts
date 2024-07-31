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

import { fetch, fetchJson, GlobalRoleBindingResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';

export const resource = 'globalrolebindings';

export function createGlobalRoleBinding(entity: GlobalRoleBindingResource) {
  const url = buildURL({ resource });
  return fetchJson<GlobalRoleBindingResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getGlobalRoleBinding(name: string) {
  const url = buildURL({ resource, name });
  return fetchJson<GlobalRoleBindingResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getGlobalRoleBindings() {
  const url = buildURL({ resource });
  return fetchJson<GlobalRoleBindingResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalRoleBinding(entity: GlobalRoleBindingResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<GlobalRoleBindingResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalRoleBinding(entity: GlobalRoleBindingResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a globalRoleBinding from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalRoleBinding(name: string) {
  return useQuery<GlobalRoleBindingResource, Error>({
    queryKey: buildQueryKey({ resource, name }),
    queryFn: () => {
      return getGlobalRoleBinding(name);
    },
  });
}

/**
 * Used to get globalRoleBindings from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalRoleBindingList() {
  return useQuery<GlobalRoleBindingResource[], Error>({
    queryKey: buildQueryKey({ resource }),
    queryFn: () => {
      return getGlobalRoleBindings();
    },
  });
}

/**
 * Returns a mutation that can be used to create a globalRoleBinding.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateGlobalRoleBindingMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalRoleBindingResource, Error, GlobalRoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: (globalRoleBinding: GlobalRoleBindingResource) => {
      return createGlobalRoleBinding(globalRoleBinding);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [...queryKey] });
    },
  });
}

/**
 * Returns a mutation that can be used to update a globalRoleBinding.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateGlobalRoleBindingMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });
  return useMutation<GlobalRoleBindingResource, Error, GlobalRoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: (globalRoleBinding: GlobalRoleBindingResource) => {
      return updateGlobalRoleBinding(globalRoleBinding);
    },
    onSuccess: (entity: GlobalRoleBindingResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a globalRoleBinding.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteGlobalRoleBindingMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalRoleBindingResource, Error, GlobalRoleBindingResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: GlobalRoleBindingResource) => {
      await deleteGlobalRoleBinding(entity);
      return entity;
    },
    onSuccess: (entity: GlobalRoleBindingResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
