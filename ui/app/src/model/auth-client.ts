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
import { fetch, fetchJson } from '@perses-dev/core';
import { useCookies } from 'react-cookie';
import { useJwt } from 'react-jwt';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodPOST } from './http';

const authResource = 'auth';
const jwtPayload = 'jwtPayload';

export interface NativeAuthResponse {
  token: string;
}

export interface NativeAuthBody {
  login: string;
  password: string;
}

export function useIsAccessTokenExist() {
  const [cookies] = useCookies();
  return cookies[jwtPayload] !== undefined;
}

// Remove error TS4058: Return type of exported function has or is using name X from external module Y but cannot be named
interface IUseJwt {
  isExpired: boolean;
  decodedToken: Payload | null;
  reEvaluateToken: (token: string) => void;
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

export function useAuthToken(): IUseJwt {
  const [cookies] = useCookies();
  const partialToken = cookies[jwtPayload];
  // useJWT need a complete token (including a signature) to be able to decode it.
  // It doesn't need the accurate signature to decode the payload.
  // That's why we are creating a fake signature.
  const fakeSignature = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  return useJwt<Payload>(`${partialToken}.${fakeSignature}`);
}

export function useNativeAuthMutation() {
  const queryClient = useQueryClient();
  return useMutation<NativeAuthResponse, Error, NativeAuthBody>({
    mutationKey: [authResource],
    mutationFn: (body: NativeAuthBody) => {
      return nativeAuth(body);
    },
    onSuccess: () => {
      return queryClient.invalidateQueries([authResource]);
    },
  });
}

export function nativeAuth(body: NativeAuthBody) {
  const url = buildURL({ resource: `${authResource}/providers/native/login`, apiPrefix: '/api' });
  return fetchJson<NativeAuthResponse>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(body),
  });
}

export function refreshToken() {
  const url = buildURL({ resource: `${authResource}/refresh`, apiPrefix: '/api' });
  return fetch(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
  });
}
