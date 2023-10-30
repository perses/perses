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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@perses-dev/core';
import { useCookies } from 'react-cookie';
import { useJwt } from 'react-jwt';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodPOST } from './http';

const authResource = 'auth';

export interface AuthResponse {
  token: string;
}

export interface AuthBody {
  login: string;
  password: string;
}

export function useAuthToken() {
  const [cookies] = useCookies();
  const partialToken = cookies['jwtPayload'];
  const fakeSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return useJwt(`${partialToken}.${fakeSignature}`);
}

export function useAuthMutation() {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, Error, AuthBody>({
    mutationKey: [authResource],
    mutationFn: (body: AuthBody) => {
      return auth(body);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([authResource]);
    },
  });
}

export function auth(body: AuthBody) {
  const url = buildURL({ resource: authResource, apiPrefix: '/api' });
  return fetchJson<AuthResponse>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(body),
  });
}
