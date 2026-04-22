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

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { fetchJson, StatusError } from '@perses-dev/core';

const resource = '/api/v1/branding';

export interface Branding {
  appName?: string;
  favicons?: {
    favicon16x16?: string;
    favicon32x32?: string;
    favicon96x96?: string;
    favicon196X196?: string;
  };
  logo?: string;
  primaryColor?: string;
  runMode?: string;
  showAppTag?: boolean;
}

type BrandingOptions = Omit<UseQueryOptions<Branding, StatusError>, 'queryKey' | 'queryFn'>;

export function useBranding(options?: BrandingOptions): UseQueryResult<Branding, StatusError> {
  return useQuery<Branding, StatusError>({
    queryKey: [resource],
    queryFn: () => {
      return fetchBranding();
    },
    ...options,
  });
}

export function fetchBranding(): Promise<Branding> {
  // Construct URL without API prefix - branding API should be at the root
  const url = window.location.origin + resource;
  return fetchJson<Branding>(url);
}
