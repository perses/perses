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

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { fetchJson } from '@perses-dev/core';
import { useCookies } from 'react-cookie';
import { decodeToken } from 'react-jwt';

import { HTTPHeader, HTTPMethodPOST } from '../http';
import buildURL from '../url-builder';
import { authResource } from './auth-client';

const jwtPayload = 'jwtPayload';

export interface NativeAuthBody {
  login: string;
  password: string;
}

interface Payload {
  iss?: string;
  sub?: string;
  aud?: string[];
  exp?: Date;
  nbf?: Date;
  iat?: Date;
  jti?: string;
}

export function useNativeAuthMutation(): UseMutationResult<void, Error, NativeAuthBody> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, NativeAuthBody>({
    mutationKey: [authResource],
    mutationFn: (body: NativeAuthBody) => {
      return nativeAuth(body);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: [authResource] });
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

export function useNativeAuthToken(): UseQueryResult<Payload | null> {
  const [cookies] = useCookies();
  const partialToken = cookies[jwtPayload];
  // useJWT need a complete token (including a signature) to be able to decode it.
  // It doesn't need the accurate signature to decode the payload.
  // That's why we are creating a fake signature.
  const fakeSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return useQuery({
    queryKey: ['jwt'],
    queryFn: () => decodeToken<Payload>(`${partialToken}.${fakeSignature}`),
    enabled: !!partialToken,
  });
}

// Retrieve the currently logged in user's username. Returns an empty string if the user is not
// logged in
export function useNativeUsername(): string {
  const { data: decodedToken } = useNativeAuthToken();
  return decodedToken?.sub ?? '';
}
