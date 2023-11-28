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

import { fetchJson as initialFetchJSON, Metadata, Permission } from '@perses-dev/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodGET, HTTPMethodPOST } from './http';
import buildQueryKey from './querykey-builder';
import { fetchJson } from './fetch';

const resource = 'users';
export const userKey = 'user';

export interface UserResource {
  kind: 'User';
  metadata: Metadata;
  spec: {
    firstName?: string;
    lastName?: string;
    password: string;
  };
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<UserResource, Error, UserResource>({
    mutationKey: [resource],
    mutationFn: (entity: UserResource) => {
      return createUser(entity);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([resource]);
    },
  });
}

/**
 * Used to get users from the API.
 * Will automatically be refreshed when cache is invalidated
 */
export function useUserList() {
  return useQuery<UserResource[], Error>(buildQueryKey({ resource }), () => {
    return getUsers();
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

export function createUser(entity: UserResource) {
  const url = buildURL({ resource });
  return initialFetchJSON<UserResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}

function getUsers() {
  const url = buildURL({ resource });
  return fetchJson<UserResource[]>(url, {
    method: HTTPMethodGET,
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
