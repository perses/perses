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

import { DatasourceStoreProviderProps } from '@perses-dev/dashboards';

export function useDatasourceApi(): DatasourceStoreProviderProps['datasourceApi'] {
  return {
    getDatasource: async (/*project, selector*/) => {
      // TODO: Convert selector to appropriate request params and fetchJson to get it from backend using project
      // argument passed in
      return undefined;
    },
    getGlobalDatasource: async (selector) => {
      // TODO: Convert selector to appropriate request params and fetchJson to get it from backend

      // Just resolve a default PrometheusDatasource right now
      if (selector.kind === 'PrometheusDatasource' && selector.name === undefined) {
        const name = 'PrometheusDemo';
        return {
          resource: {
            kind: 'GlobalDatasource',
            metadata: {
              name,
              created_at: '',
              updated_at: '',
              version: 0,
            },
            spec: {
              default: true,
              display: {
                name: 'Prometheus Demo',
              },
              plugin: {
                kind: 'PrometheusDatasource',
                spec: {
                  direct_url: 'https://prometheus.demo.do.prometheus.io',
                },
              },
            },
          },
          proxyUrl: `/proxy/globaldatasources/${encodeURIComponent(name)}`,
        };
      }
      return undefined;
    },
  };
}
