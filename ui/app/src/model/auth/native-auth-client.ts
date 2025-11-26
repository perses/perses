// Copyright 2025 The Perses Authors
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

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@perses-dev/core';

import { HTTPHeader, HTTPMethodPOST } from '../http';
import buildQueryKey from '../querykey-builder';
import buildURL from '../url-builder';
import { userResource } from '../user-client';
import { authResource } from './auth-client';

export interface NativeAuthBody {
  login: string;
  password: string;
}

export function useNativeAuthMutation(): UseMutationResult<void, Error, NativeAuthBody> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, NativeAuthBody>({
    mutationKey: [authResource],
    mutationFn: (body: NativeAuthBody) => {
      return nativeAuth(body);
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [authResource] }),
        queryClient.invalidateQueries({ queryKey: buildQueryKey({ resource: userResource, name: 'me' }) }),
      ]);
    },
  });
}

export function nativeAuth(body: NativeAuthBody): Promise<void> {
  const url = buildURL({ resource: `${authResource}/providers/native/login`, apiURL: '/api' });
  return fetchJson<void>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(body),
  });
}
