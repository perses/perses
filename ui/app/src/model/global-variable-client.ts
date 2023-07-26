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

import { fetch, fetchJson, GlobalVariableResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';

const resource = 'globalvariables';

export function createGlobalVariable(entity: GlobalVariableResource) {
  const url = buildURL({ resource });
  return fetchJson<GlobalVariableResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getGlobalVariable(name: string) {
  const url = buildURL({ resource, name });
  return fetchJson<GlobalVariableResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getGlobalVariables() {
  const url = buildURL({ resource });
  return fetchJson<GlobalVariableResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalVariable(entity: GlobalVariableResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<GlobalVariableResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalVariable(entity: GlobalVariableResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a global variable from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalVariable(name: string) {
  return useQuery<GlobalVariableResource, Error>(buildQueryKey({ resource, name }), () => {
    return getGlobalVariable(name);
  });
}

/**
 * Used to get global variables from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalVariableList() {
  return useQuery<GlobalVariableResource[], Error>(buildQueryKey({ resource }), () => {
    return getGlobalVariables();
  });
}

/**
 * Returns a mutation that can be used to create a global variable.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateGlobalVariableMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalVariableResource, Error, GlobalVariableResource>({
    mutationKey: queryKey,
    mutationFn: (entity: GlobalVariableResource) => {
      return createGlobalVariable(entity);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries(queryKey);
    },
  });
}

/**
 * Returns a mutation that can be used to update a global variable.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateGlobalVariableMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalVariableResource, Error, GlobalVariableResource>({
    mutationKey: queryKey,
    mutationFn: (variable: GlobalVariableResource) => {
      return updateGlobalVariable(variable);
    },
    onSuccess: (entity: GlobalVariableResource) => {
      return Promise.all([
        queryClient.invalidateQueries([...queryKey, entity.metadata.name]),
        queryClient.invalidateQueries(queryKey),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a global variable.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteGlobalVariableMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalVariableResource, Error, GlobalVariableResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: GlobalVariableResource) => {
      await deleteGlobalVariable(entity);
      return entity;
    },
    onSuccess: (entity: GlobalVariableResource) => {
      queryClient.removeQueries([...queryKey, entity.metadata.name]);
      return queryClient.invalidateQueries(queryKey);
    },
  });
}
