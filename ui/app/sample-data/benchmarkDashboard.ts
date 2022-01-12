// Copyright 2021 The Perses Authors
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

import { AnyVariableDefinition, DashboardResource } from '@perses-ui/core';

const benchmarkDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Node Stats',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
  },
  spec: {
    datasource: { kind: 'Prometheus', name: 'PrometheusDemo', global: true },
    duration: '12h',
    variables: {
      job: {
        kind: 'PrometheusLabelValues',
        options: {
          label_name: 'job',
          match: ['node_uname_info'],
        },
        display: {
          label: 'Job',
        },
        selection: {
          default_value: 'node',
        },
      } as AnyVariableDefinition,
      instance: {
        kind: 'PrometheusLabelValues',
        options: {
          label_name: 'instance',
          match: ['node_uname_info{job="node"}'],
        },
        display: {
          label: 'Node',
        },
        selection: {
          default_value: ['demo.do.prometheus.io:9100'],
          all_value: '$__all',
        },
      } as AnyVariableDefinition,
      interval: {
        kind: 'Interval',
        options: {
          values: ['1m', '5m', '10m', '1h'],
          auto: {
            step_count: 50,
            min_interval: '1m',
          },
        },
        display: {
          label: 'Interval',
        },
        selection: {
          default_value: '1h',
        },
      } as AnyVariableDefinition,
    },
    panels: {
      seriesTest: {
        kind: 'LineChart',
        display: { name: '1500+ Series' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'rate(caddy_http_request_duration_seconds_bucket[$interval])',
                // query: 'caddy_http_request_duration_seconds_bucket',
              },
            },
          ],
          unit: { kind: 'Bytes' },
        },
      },
      seriesTestAlt: {
        kind: 'LineChart',
        display: { name: '~130 Series' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'rate(caddy_http_response_duration_seconds_sum[$interval])',
                // query: 'histogram_quantile(0.9, rate(caddy_http_request_duration_seconds_bucket[$interval]))',
              },
            },
          ],
          unit: { kind: 'Bytes' },
        },
      },
      basicEx: {
        kind: 'LineChart',
        display: { name: 'Single Query' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  '1 - node_filesystem_free_bytes{job="node",instance="$instance",fstype!="rootfs",mountpoint!~"/(run|var).*",mountpoint!=""} / node_filesystem_size_bytes{job="node",instance="$instance"}',
              },
            },
          ],
          unit: { kind: 'Percent' },
        },
      },
      multiQueries: {
        kind: 'LineChart',
        display: { name: 'Multi Queries' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  'node_memory_MemTotal_bytes{job="node",instance="$instance"} - node_memory_MemFree_bytes{job="node",instance="$instance"} - node_memory_Buffers_bytes{job="node",instance="$instance"} - node_memory_Cached_bytes{job="node",instance="$instance"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'node_memory_Buffers_bytes{job="node",instance="$instance"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'node_memory_Cached_bytes{job="node",instance="$instance"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'node_memory_MemFree_bytes{job="node",instance="$instance"}',
              },
            },
          ],
          unit: { kind: 'Bytes' },
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        display: {
          title: 'Row 1',
          collapse: {
            open: true,
          },
        },
        items: [
          {
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            content: { $ref: '#/panels/seriesTest' },
          },
          {
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            content: { $ref: '#/panels/basicEx' },
          },
        ],
      },
      {
        kind: 'Grid',
        display: {
          title: 'Row 2',
          collapse: {
            open: true,
          },
        },
        items: [
          {
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            content: { $ref: '#/panels/seriesTestAlt' },
          },
          {
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            content: { $ref: '#/panels/multiQueries' },
          },
        ],
      },
    ],
  },
};

export default benchmarkDashboard;
