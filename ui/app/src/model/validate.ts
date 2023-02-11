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

import { useMutation } from '@tanstack/react-query';
import { DashboardResource, fetchJson } from '@perses-dev/core';
import buildURL from './url-builder';
import { HTTPHeader, HTTPMethodPOST } from './http';

const resource = 'validate/dashboards';

export interface ValiateBodyRequest {
  dashboard: string;
}

export function useValidateDashboard() {
  return useMutation<DashboardResource, Error, ValiateBodyRequest>({
    mutationKey: [resource],
    mutationFn: (body) => {
      const url = buildURL({ apiPrefix: '/api', resource: resource });
      return fetchJson<DashboardResource>(url, {
        method: HTTPMethodPOST,
        headers: HTTPHeader,
        body: body.dashboard,
      });
    },
  });
}
