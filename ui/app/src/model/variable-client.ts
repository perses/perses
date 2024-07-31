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

import { VariableResource } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';
import { fetch, fetchJson } from './fetch';

export const resource = 'variables';

export function createVariable(entity: VariableResource) {
  const project = entity.metadata.project;
  const url = buildURL({ resource, project });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getVariable(name: string, project: string) {
  const url = buildURL({ resource, project, name });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getVariables(project?: string) {
  const url = buildURL({ resource, project });
  return fetchJson<VariableResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateVariable(entity: VariableResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetchJson<VariableResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteVariable(entity: VariableResource) {
  const name = entity.metadata.name;
  const project = entity.metadata.project;
  const url = buildURL({ resource, project, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a variable from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useVariable(name: string, project: string) {
  return useQuery<VariableResource, Error>({
    queryKey: buildQueryKey({ resource, name, parent: project }),
    queryFn: () => {
      return getVariable(name, project);
    },
  });
}

/**
 * Used to get variables from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useVariableList(project?: string) {
  return useQuery<VariableResource[], Error>({
    queryKey: buildQueryKey({ resource, parent: project }),
    queryFn: () => {
      return getVariables(project);
    },
  });
}

/**
 * Returns a mutation that can be used to create a variable.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useCreateVariableMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: queryKey,
    mutationFn: (variable: VariableResource) => {
      return createVariable(variable);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Returns a mutation that can be used to update a variable.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useUpdateVariableMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });
  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: queryKey,
    mutationFn: (variable: VariableResource) => {
      return updateVariable(variable);
    },
    onSuccess: (entity: VariableResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a variable.
 * Will automatically refresh the cache for all the list.
 *
 * Note: the project input shouldn't be mandatory according to the API, but it is here for cache considerations.
 * @param project
 */
export function useDeleteVariableMutation(project: string) {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource, parent: project });

  return useMutation<VariableResource, Error, VariableResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: VariableResource) => {
      await deleteVariable(entity);
      return entity;
    },
    onSuccess: (entity: VariableResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
