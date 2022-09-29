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

import { DashboardResource } from '@perses-dev/core';

const demoDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Template Variable Demo',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
    version: 0,
  },
  spec: {
    datasource: { kind: 'Prometheus', name: 'PrometheusDemo', global: true },
    duration: '30m',
    variables: [
      {
        kind: 'ListVariable',
        spec: {
          name: 'job',
          allowAllValue: true,
          defaultValue: 'prometheus',
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'job',
            },
          },
        },
      },
      {
        kind: 'ListVariable',
        spec: {
          name: 'handler',
          allowMultiple: true,
          allowAllValue: true,
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'handler',
              matchers: ['prometheus_http_requests_total{job=~"$job"}'],
            },
          },
        },
      },
      {
        kind: 'ListVariable',
        spec: {
          name: 'code',
          allowAllValue: true,
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'code',
              matchers: ['prometheus_http_requests_total{job=~"$job", handler=~"$handler"}'],
            },
          },
        },
      },

      {
        kind: 'ListVariable',
        spec: {
          name: 'interval',
          plugin: {
            kind: 'StaticListVariable',
            spec: {
              values: ['1m', '5m', '10m'],
            },
          },
        },
      },
      {
        kind: 'ListVariable',
        spec: {
          name: 'labelNames',
          allowMultiple: true,
          plugin: {
            kind: 'PrometheusLabelNamesVariable',
            spec: {},
          },
        },
      },
    ],
    panels: {
      demoPanel: {
        kind: 'Panel',
        spec: {
          display: { name: 'Prom HTTP Requests', description: 'This is a line chart' },
          plugin: {
            kind: 'LineChart',
            spec: {
              queries: [
                {
                  kind: 'GraphQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusGraphQuery',
                      spec: {
                        query:
                          'irate(prometheus_http_requests_total{job=~"$job", handler=~"$handler", code=~"$code"}[$interval])',
                      },
                    },
                  },
                },
              ],
              unit: { kind: 'Bytes' },
            },
          },
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Sample Row',
            collapse: {
              open: true,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 24,
              height: 6,
              content: { $ref: '#/spec/panels/demoPanel' },
            },
          ],
        },
      },
    ],
  },
};

export default demoDashboard;
