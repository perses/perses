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

import { fetch } from '@perses-dev/core';
import { useQueryParam } from 'use-query-params';
import buildURL from '../url-builder';
import { HTTPHeader, HTTPMethodPOST } from '../http';
import { useAuthorizationProvider } from '../../context/Config';
import { useNativeUsername } from './native-auth-client';
import { useExternalUsername } from './external-auth-client';

export const authResource = 'auth';
export const authnResource = 'authn';
const redirectQueryParam = 'rd';

/**
 * Get the redirect path from URL's query params.
 * This is used to retrieve the original path that a user desired before being redirected to the login page.
 */
export function useRedirectQueryParam(): string {
  const [path] = useQueryParam<string | undefined>('name');
  return path ?? '/';
}

/**
 * Build a query string with the redirect path. Related with {@link useRedirectQueryParam}
 * @param path original path desired by the user before being redirected to the login page.
 */
export function buildRedirectQueryString(path: string): string {
  return `${redirectQueryParam}=${encodeURIComponent(path)}`;
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
  const authProvider = useAuthorizationProvider();
  const nativeUsername = useNativeUsername();
  const externalUsername = useExternalUsername();

  switch (authProvider) {
    case 'native':
      return nativeUsername;
    case 'external':
      return externalUsername;
    case 'none':
      return '';
  }
}

export function useIsLoggedIn(): boolean {
  return !!useUsername();
}
