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

import { fetchJson, Permission, StatusError, UserResource } from '@perses-dev/core';
import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildQueryKey from './querykey-builder';

const resource = 'users';
export const userKey = 'user';

function createUser(entity: UserResource): Promise<UserResource> {
  const url = buildURL({ resource });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getUser(name: string): Promise<UserResource> {
  const url = buildURL({ resource, name });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getUsers(): Promise<UserResource[]> {
  const url = buildURL({ resource });
  return fetchJson<UserResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function updateUser(entity: UserResource): Promise<UserResource> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}
function deleteUser(entity: UserResource): Promise<Response> {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

function getUserPermissions(username: string): Promise<Record<string, Permission[]>> {
  const url = buildURL({ resource, name: username, pathSuffix: ['permissions'] });
  // If username is empty it's useless to request API
  if (!username) {
    return Promise.resolve({});
  }
  return fetchJson<Record<string, Permission[]>>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

/**
 * Used to get a global secret from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUser(name: string): UseQueryResult<UserResource, StatusError> {
  return useQuery<UserResource, StatusError>({
    queryKey: buildQueryKey({ resource, name }),
    queryFn: () => {
      return getUser(name);
    },
  });
}

/**
 * Used to get global secrets from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUserList(): UseQueryResult<UserResource[], StatusError> {
  return useQuery<UserResource[], StatusError>({
    queryKey: buildQueryKey({ resource }),
    queryFn: () => {
      return getUsers();
    },
  });
}

/**
 * Returns a mutation that can be used to create a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateUserMutation(): UseMutationResult<UserResource, StatusError, UserResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, StatusError, UserResource>({
    mutationKey: queryKey,
    mutationFn: (entity: UserResource) => {
      return createUser(entity);
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
export function useUpdateUserMutation(): UseMutationResult<UserResource, StatusError, UserResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, StatusError, UserResource>({
    mutationKey: queryKey,
    mutationFn: (secret: UserResource) => {
      return updateUser(secret);
    },
    onSuccess: (entity: UserResource) => {
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
export function useDeleteUserMutation(): UseMutationResult<UserResource, StatusError, UserResource> {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, StatusError, UserResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: UserResource) => {
      await deleteUser(entity);
      return entity;
    },
    onSuccess: (entity: UserResource) => {
      queryClient.removeQueries({ queryKey: [...queryKey, entity.metadata.name] });
      return queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Used to get users from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUserPermissions(username: string): UseQueryResult<Record<string, Permission[]>, StatusError> {
  return useQuery<Record<string, Permission[]>, StatusError>({
    queryKey: [userKey, username, 'permissions'],
    queryFn: () => {
      return getUserPermissions(username);
    },
  });
}
