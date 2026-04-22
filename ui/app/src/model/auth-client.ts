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
import { fetch, fetchJson } from '@perses-dev/core';
import { useCookies } from 'react-cookie';
import { decodeToken } from 'react-jwt';
import { useEffect, useState } from 'react';
import { useQueryParam } from 'use-query-params';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodGET, HTTPMethodPOST } from './http';
import { activeOrganization } from '../constants/auth-token';

const authResource = 'auth';
const jwtPayload = 'jwtPayload';
const iLikeAce = 'i_like_ace';
const iLikeBytebuilders = 'i_like_bytebuilders';
const redirectQueryParam = 'rd';
const cookieRefreshTime = 500;

export interface NativeAuthBody {
  login: string;
  password: string;
}

export interface Metadata {
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  userID: number;
  projectID: number;
  folderID: number;
}

export interface OAuthProvider {
  email: string;
}

export interface NativeProvider {
  password?: string;
}

export interface Spec {
  firstName?: string;
  nativeProvider: NativeProvider;
  oauthProviders: OAuthProvider[];
}

export interface BaseUser {
  kind: string;
  metadata: Metadata;
  spec: Spec;
  user_type?: 'user' | 'org';
}

export type User = BaseUser;
export type Organization = BaseUser;

export function useIsAccessTokenExist(): boolean {
  const [cookies] = useCookies();

  // Don't directly say "false" when cookie disappear as it's removed/recreated directly by refresh mechanism.
  const [debouncedValue, setDebouncedValue] = useState(cookies);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(cookies);
    }, cookieRefreshTime);

    return (): void => clearTimeout(timer);
  }, [cookies]);

  // Check if any of these cookies exist
  const hasAuthCookie =
    debouncedValue[activeOrganization] !== undefined ||
    debouncedValue[iLikeAce] !== undefined ||
    debouncedValue[iLikeBytebuilders] !== undefined;

  return hasAuthCookie;
}

/**
 * Get the redirect path from URL's query params.
 * This is used to retrieve the original path that a user desired before being redirected to the login page.
 */
export function useRedirectQueryParam(): string {
  const [path] = useQueryParam<string | undefined>(redirectQueryParam);
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

export function useActiveUser(): string | undefined {
  const [cookies] = useCookies([activeOrganization]);
  return cookies[activeOrganization] || undefined;
}

export function useUserApi(): UseQueryResult<User | null> {
  const user = useActiveUser();

  return useQuery<User | null>({
    queryKey: [],
    queryFn: async () => {
      if (!user) return null;
      const response = await getUser();
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user,
  });
}

export function useOrganizationList(user: string | undefined): UseQueryResult<Organization[] | null> {
  return useQuery<Organization[] | null>({
    queryKey: [user],
    queryFn: async () => {
      if (!user) return null;
      const response = await getOrganizations(user);
      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!user,
  });
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
  const url = buildURL({ resource: `${authResource}/providers/native/login`, apiURL: '/api' });
  return fetchJson<void>(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
    body: JSON.stringify(body),
  });
}

export function refreshToken(): Promise<Response> {
  const url = buildURL({ resource: `${authResource}/refresh`, apiURL: '/api' });
  return fetch(url, {
    method: HTTPMethodPOST,
    headers: HTTPHeader,
  });
}

export function getOrganizations(user: string): Promise<Response> {
  const url = buildURL({ resource: `users/${user}/orgs` });
  return fetch(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}

export function getUser(): Promise<Response> {
  const url = buildURL({ resource: `user` });
  return fetch(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}
