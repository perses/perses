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

import { fetchJson, UserResource } from '@perses-dev/core';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { useAuthorizationProvider } from '../../context/Config';
import buildURL from '../url-builder';
import { userResource } from '../user-client';
import { HTTPHeader, HTTPMethodGET } from '../http';
import { authnResource } from './auth-client';

export type ExternalAuthProviders = 'none' | 'kubernetes';

export function useExternalUsername(): string {
  const me = useExternalAuthn();
  return me.data?.metadata.name ?? '';
}

export function useExternalAuthn(): UseQueryResult<UserResource, Error> {
  const authProvider = useAuthorizationProvider();
  return useQuery<UserResource, Error>({
    queryKey: [authnResource],
    queryFn: externalAuthn,
    enabled: authProvider === 'external',
  });
}

export function externalAuthn(): Promise<UserResource> {
  // for now the only external authentication option is kubernetes
  const url = buildURL({ resource: `${userResource}/me` });
  return fetchJson<UserResource>(url, {
    method: HTTPMethodGET,
    headers: HTTPHeader,
  });
}
