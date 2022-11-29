// Copyright 2022 The Perses Authors
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

const resource = 'migrate';

export interface MigrateBodyRequest {
  input?: Record<string, string>;
  grafana_dashboard: string;
}

export function useMigrate() {
  return useMutation<DashboardResource, Error, MigrateBodyRequest>({
    mutationKey: [resource],
    mutationFn: (body) => {
      const url = buildURL({ apiPrefix: '/api', resource: resource });
      return fetchJson<DashboardResource>(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: `{"input":${body.input ? JSON.stringify(body.input) : '{}'}, "grafana_dashboard": ${
          body.grafana_dashboard
        }}`,
      });
    },
  });
}
