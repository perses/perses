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

import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { fetch, fetchJson } from '@perses-dev/core';
import { useCookies } from 'react-cookie';
import { decodeToken } from 'react-jwt';
import { useQueryParam } from 'use-query-params';
import { useEffect, useState } from 'react';
import { useExternalProvider } from '../context/Config';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodGET, HTTPMethodPOST } from './http';

const authResource = 'auth';
const authnResource = 'authn';
const jwtPayload = 'jwtPayload';
const redirectQueryParam = 'rd';
const cookieRefreshTime = 500;

export type ExternalAuthProviders = 'none' | 'kubernetes';

export interface NativeAuthBody {
  login: string;
  password: string;
}

export function useIsAccessTokenExist(isAuthEnabled: boolean): boolean {
  const [cookies] = useCookies();
  const accessToken = useAuthToken();

  // Warm the access token request cache back
  // If the refresh token is not expired, the debounce mechanism will get the refreshed accedd token.
  // Otherwise, debounce will let pass the empty access token and auth guard will redirect to sign in.
  if (isAuthEnabled && (!accessToken?.data?.exp || accessToken.data.exp > new Date())) {
    refreshToken();
  }

  // Don't directly say "false" when cookie disappear as it's removed/recreated directly by refresh mechanism.
  const [debouncedValue, setDebouncedValue] = useState(cookies);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(cookies);
    }, cookieRefreshTime);

    return (): void => clearTimeout(timer);
  }, [cookies]);

  return debouncedValue[jwtPayload] !== undefined;
}

export function useExternalUsername(externalProvider: ExternalAuthProviders): string {
  const whoami = useExternalAuthWhoami(externalProvider);
  return whoami.data?.name ?? '';
}

/**
 * Get the redirect path from URL's query params.
 * This is used to retrieve the original path that a user desired before being redirected to the login page.
 */
export function useRedirectQueryParam(): string {
  const [path] = useQueryParam<string>(redirectQueryParam);
  return path ?? '/';
}

/**
 * Build a query string with the redirect path. Related with {@link useRedirectQueryParam}
 * @param path original path desired by the user before being redirected to the login page.
 */
export function buildRedirectQueryString(path: string): string {
  return `${redirectQueryParam}=${encodeURIComponent(path)}`;
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

export function useAuthToken(): UseQueryResult<Payload | null> {
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
  const url = buildURL({ resource: `${authResource}/providers/native/login`, apiPrefix: '/api' });
  return fetchJson<void>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(body),
  });
}

export function useExternalAuthWhoami(
  externalProvider: ExternalAuthProviders
): UseQueryResult<{ name: string }, Error> {
  return useQuery<{ name: string }, Error>({
    queryKey: [authnResource, externalProvider],
    queryFn: async (): Promise<{ name: string }> => {
      if (externalProvider === 'none') {
        return new Promise(() => {
          return {
            name: '',
          };
        });
      }
      return await externalAuth(externalProvider);
    },
  });
}

export function externalAuth(externalProvider: 'kubernetes'): Promise<{ name: string }> {
  // for now the only external authentication option is kubernetes
  const url = buildURL({ resource: `${authResource}/providers/${externalProvider}/whoami`, apiPrefix: '/api' });
  return fetchJson<{ name: string }>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function refreshToken(): Promise<Response> {
  const url = buildURL({ resource: `${authResource}/refresh`, apiPrefix: '/api' });
  return fetch(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
  });
}

// Retrieve the currently logged in user's username. Returns an empty string if the user is not
// logged in
export function useUsername(): string {
  const { data: decodedToken } = useAuthToken();
  const externalProvider = useExternalProvider();
  const externalLogin = useExternalUsername(externalProvider);
  return decodedToken?.sub || externalLogin;
}
