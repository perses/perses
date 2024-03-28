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

import { Metadata, Permission } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodDELETE, HTTPMethodGET, HTTPMethodPOST, HTTPMethodPUT } from './http';
import buildQueryKey from './querykey-builder';
import { fetch, fetchJson } from './fetch';

const resource = 'users';
export const userKey = 'user';

export interface UserResource {
  kind: 'User';
  metadata: Metadata;
  spec: {
    firstName?: string;
    lastName?: string;
    nativeProvider?: {
      password?: string;
    };
    oauthProviders?: Array<{
      issuer?: string;
      email?: string;
      subject?: string;
    }>;
  };
}

function createUser(entity: UserResource) {
  const url = buildURL({ resource });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getUser(name: string) {
  const url = buildURL({ resource, name });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function getUsers() {
  const url = buildURL({ resource });
  return fetchJson<UserResource[]>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

function updateUser(entity: UserResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodPUT,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}
function deleteUser(entity: UserResource) {
  const name = entity.metadata.name;
  const url = buildURL({ resource, name });
  return fetch(url, {
    method: HTTPMethodDELETE,
    headers: HTTPHeader,
  });
}

function getUserPermissions(username: string) {
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
export function useUser(name: string) {
  return useQuery<UserResource, Error>(buildQueryKey({ resource, name }), () => {
    return getUser(name);
  });
}

/**
 * Used to get global secrets from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUserList() {
  return useQuery<UserResource[], Error>(buildQueryKey({ resource }), () => {
    return getUsers();
  });
}

/**
 * Returns a mutation that can be used to create a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, Error, UserResource>({
    mutationKey: queryKey,
    mutationFn: (entity: UserResource) => {
      return createUser(entity);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries(queryKey);
    },
  });
}

/**
 * Returns a mutation that can be used to update a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, Error, UserResource>({
    mutationKey: queryKey,
    mutationFn: (secret: UserResource) => {
      return updateUser(secret);
    },
    onSuccess: (entity: UserResource) => {
      return Promise.all([
        queryClient.invalidateQueries([...queryKey, entity.metadata.name]),
        queryClient.invalidateQueries(queryKey),
      ]);
    },
  });
}

/**
 * Returns a mutation that can be used to delete a global secret.
 * Will automatically refresh the cache for all the list.
 */
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  const queryKey = buildQueryKey({ resource });

  return useMutation<UserResource, Error, UserResource>({
    mutationKey: queryKey,
    mutationFn: async (entity: UserResource) => {
      await deleteUser(entity);
      return entity;
    },
    onSuccess: (entity: UserResource) => {
      queryClient.removeQueries([...queryKey, entity.metadata.name]);
      return queryClient.invalidateQueries(queryKey);
    },
  });
}

/**
 * Used to get users from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUserPermissions(username: string) {
  return useQuery<Record<string, Permission[]>, Error>([userKey, username, 'permissions'], () => {
    return getUserPermissions(username);
  });
}
