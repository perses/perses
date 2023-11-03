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

import { fetchJson, Metadata } from '@perses-dev/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodPOST } from './http';

const userResource = 'users';

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
    mutationKey: [userResource],
    mutationFn: (entity: UserResource) => {
      return createUser(entity);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([userResource]);
    },
  });
}

export function createUser(entity: UserResource) {
  const url = buildURL({ resource: userResource });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(entity),
  });
}
