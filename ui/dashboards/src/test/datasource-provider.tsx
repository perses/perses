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

import { GlobalDatasource } from '@perses-dev/core';
import { DatasourceStoreProviderProps } from '../context';
import { getTestDashboard } from './dashboard-provider';

export const prometheusDemoUrl = 'https://prometheus.demo.do.prometheus.io';
export const prometheusDemo: GlobalDatasource = {
  kind: 'GlobalDatasource',
  metadata: {
    name: 'PrometheusDemo',
    created_at: '0001-01-01T00:00:00Z',
    updated_at: '0001-01-01T00:00:00Z',
    version: 0,
  },
  spec: {
    default: true,
    plugin: {
      kind: 'PrometheusDatasource',
      spec: { direct_url: prometheusDemoUrl },
    },
  },
} as const;

// This default currently defines the bare minimum to get a story working in
// the `Dashboard` storybook with the Prometheus demo api. We'll likely want
// to expand it to do more in the future.
export const defaultDatasourceProps: Pick<DatasourceStoreProviderProps, 'datasourceApi' | 'dashboardResource'> = {
  dashboardResource: getTestDashboard(),
  datasourceApi: {
    getDatasource: () => {
      return Promise.resolve(undefined);
    },
    getGlobalDatasource: (selector) => {
      if (selector.kind === 'PrometheusDatasource') {
        return Promise.resolve({ resource: prometheusDemo, proxyUrl: prometheusDemoUrl });
      }

      return Promise.resolve(undefined);
    },
    listDatasources: () => {
      return Promise.resolve([]);
    },
    listGlobalDatasources: () => {
      return Promise.resolve([]);
    },
  },
};
