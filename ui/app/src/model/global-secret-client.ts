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

import { GlobalSecretResource } from '@perses-dev/core';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import { buildQueryKey } from './querykey-builder';
import { fetch, fetchJson } from './fetch';

const resource = 'globalsecrets';

export function createGlobalSecret(entity: GlobalSecretResource): Promise<GlobalSecretResource> {
  const url = buildURL({ resource });
  return fetchJson<GlobalSecretResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getGlobalSecret(name: string): Promise<GlobalSecretResource> {
  const url = buildURL({ resource, name });
  return fetchJson<GlobalSecretResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getGlobalSecrets(): Promise<GlobalSecretResource[]> {
  const url = buildURL({ resource });
  return fetchJson<GlobalSecretResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function updateGlobalSecret(entity: GlobalSecretResource): Promise<GlobalSecretResource> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<GlobalSecretResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

export function deleteGlobalSecret(entity: GlobalSecretResource): Promise<Response> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a global secret from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalSecret(name: string): UseQueryResult<GlobalSecretResource> {
  return useQuery<GlobalSecretResource, Error>({
    queryKey: buildQueryKey({ resource, name }),
    queryFn: () => {
      return getGlobalSecret(name);
    },
  });
}

/**
 * Used to get global secrets from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useGlobalSecretList(): UseQueryResult<GlobalSecretResource[]> {
  return useQuery<GlobalSecretResource[], Error>({
    queryKey: buildQueryKey({ resource }),
    queryFn: () => {
      return getGlobalSecrets();
    },
  });
}

/**
 * Returns a mutation that can be used to create a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateGlobalSecretMutation(): UseMutationResult<GlobalSecretResource, Error, GlobalSecretResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalSecretResource, Error, GlobalSecretResource>({
    mutationKey: queryKey,
    mutationFn: (entity: GlobalSecretResource) => {
      return createGlobalSecret(entity);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Returns a mutation that can be used to update a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateGlobalSecretMutation(): UseMutationResult<GlobalSecretResource, Error, GlobalSecretResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalSecretResource, Error, GlobalSecretResource>({
    mutationKey: queryKey,
    mutationFn: (secret: GlobalSecretResource) => {
      return updateGlobalSecret(secret);
    },
    onSuccess: (entity: GlobalSecretResource) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: [...queryKey, entity.metadata.name] }),
        queryClient.invalidateQueries({ queryKey }),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteGlobalSecretMutation(): UseMutationResult<GlobalSecretResource, Error, GlobalSecretResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<GlobalSecretResource, Error, GlobalSecretResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: GlobalSecretResource) => {
      await deleteGlobalSecret(entity);
      return entity;
    },
    onSuccess: (entity: GlobalSecretResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}
