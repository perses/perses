// Copyright The Perses Authors
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

import type {
  DashboardResource,
  DatasourceResource,
  GlobalDatasourceResource,
  ProjectResource,
} from '@perses-dev/client';
import type { DashboardSpec, DatasourceSpec } from '@perses-dev/spec';

import type { ConfigModel } from '../../../model/config-client';

export const MOCK_CLIENT_CONFIG: ConfigModel = {
  api_prefix: '/api',
  database: {},
  datasource: {
    disable_local: true,
    global: { disable: true },
    project: { disable: true },
  },
  ephemeral_dashboard: {
    cleanup_interval: '30m',
    enable: false,
  },
  variable: {
    disable_local: true,
    global: { disable: true },
    project: { disable: true },
  },
  frontend: {
    default_user_preferences: {
      timezone: 'UTC',
    },
    explorer: { enable: true },
  },
  security: {
    enable_auth: false,
    readonly: true,
    authentication: {
      access_token_ttl: '15m',
      refresh_token_ttl: '24h',
      disable_sign_up: false,
      providers: { enable_native: false, oauth: [], oidc: [] },
    },
    authorization: {
      provider: {},
    },
  },
};

export const DASHBOARDS_RESOURCES: DashboardResource[] = [
  {
    kind: 'Dashboard',
    metadata: { name: 'DASH1', project: 'P1' },
    spec: {} as DashboardSpec,
  },
  {
    kind: 'Dashboard',
    metadata: { name: 'DASH2', project: 'P1' },
    spec: {} as DashboardSpec,
  },
  {
    kind: 'Dashboard',
    metadata: { name: 'DASH3', project: 'P2' },
    spec: {} as DashboardSpec,
  },
];

export const IMPORTANT_DASHBOARDS_RESOURCES: DashboardResource[] = [
  {
    kind: 'Dashboard',
    metadata: { name: 'DASH3', project: 'P2' },
    spec: {} as DashboardSpec,
  },
];

export const PROJECT_RESOURCE: ProjectResource[] = [
  {
    kind: 'Project',
    metadata: { name: 'PR1' },
  },
  {
    kind: 'Project',
    metadata: { name: 'PR2' },
  },
];

export const DATASOURCE_RESOURCE: DatasourceResource[] = [
  {
    kind: 'Datasource',
    metadata: {
      name: 'DS1',
      project: 'P1',
    },
    spec: {
      display: { name: 'DS1' },
      plugin: {
        kind: 'Prometheus',
      },
    } as DatasourceSpec,
  },
  {
    kind: 'Datasource',
    metadata: {
      name: 'DS2',
      project: 'P1',
    },
    spec: {
      display: { name: 'DS2' },
      plugin: {
        kind: 'Prometheus',
      },
    } as DatasourceSpec,
  },
];

export const GLOBAL_DATASOURCE_RESOURCE: GlobalDatasourceResource[] = [
  {
    kind: 'GlobalDatasource',
    metadata: {
      name: 'GDS1',
      createdAt: '2026-05-13T12:07:04.1260879Z',
      updatedAt: '2026-10-13T11:54:35.2505001Z',
      version: 647,
    },
    spec: {
      default: true,
      plugin: {
        kind: 'PrometheusDatasource',
        spec: {
          proxy: {
            kind: 'HTTPProxy',
            spec: {
              url: 'http://localhost:9090',
            },
          },
        },
      },
    },
  },
  {
    kind: 'GlobalDatasource',
    metadata: {
      name: 'GDS2',
      createdAt: '2026-10-13T11:38:13.2488566Z',
      updatedAt: '2026-10-13T11:38:13.2488566Z',
      version: 0,
    },
    spec: {
      display: {
        name: 'GDS2',
      },
      default: false,
      plugin: {
        kind: 'PrometheusDatasource',
        spec: {
          directUrl: 'http://localhost:9090/',
        },
      },
    },
  },
];
