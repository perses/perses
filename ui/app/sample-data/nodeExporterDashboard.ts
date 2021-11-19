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

import { DashboardResource, AnyVariableDefinition } from '@perses-ui/core';

const nodeExporterDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Node Stats',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
  },
  spec: {
    datasource: { name: 'Public Prometheus Demo Server' },
    // TODO: Should duration actually be a time range?
    duration: '24h',
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
          default_value: '1m',
        },
      } as AnyVariableDefinition,
    },
    panels: {
      gaugeEx: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Example' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'sum(irate(node_cpu_seconds_total[5m])) / count(count(node_cpu_seconds_total) by (cpu, instance))',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'PercentDecimal', decimal_places: 0 },
          // TODO (sjcobb): pass optional threshold data to GaugeChart
          // thresholds: {
          //   steps: [
          //     [0.8, 'rgb(115, 191, 105)'],
          //     [0.9, 'rgba(237, 129, 40, 0.89)'],
          //     [1, 'rgba(245, 54, 54, 0.9)'],
          //   ],
          // },
        },
      },
      gaugeExAlt: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Example 2' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '1 - node_filesystem_free_bytes{job="node",instance="$instance",fstype!="rootfs",mountpoint!~"/(run|var).*",mountpoint!=""} / node_filesystem_size_bytes{job="node",instance="$instance"}',
            },
          },
          calculation: 'Mean',
          unit: { kind: 'PercentDecimal', decimal_places: 0 },
        },
      },
      emptyExample: {
        kind: 'EmptyChart',
        display: { name: 'Empty Example 1' },
        options: {},
      },
      emptyExample2: {
        kind: 'EmptyChart',
        display: { name: 'Empty Example 2' },
        options: {},
      },
      emptyExample3: {
        kind: 'EmptyChart',
        display: { name: 'Empty Example 3' },
        options: {},
      },
      cpu: {
        kind: 'LineChart',
        display: { name: 'CPU' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  'avg without (cpu)(rate(node_cpu_seconds_total{job="node",instance="$instance",mode!="idle"}[$interval]))',
              },
            },
          ],
          unit: { kind: '%' },
        },
      },
      memory: {
        kind: 'LineChart',
        display: { name: 'Memory' },
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
                query:
                  'node_memory_Buffers_bytes{job="node",instance="$instance"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  'node_memory_Cached_bytes{job="node",instance="$instance"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  'node_memory_MemFree_bytes{job="node",instance="$instance"}',
              },
            },
          ],
          unit: { kind: 'Bytes' },
        },
      },
      diskIO: {
        kind: 'LineChart',
        display: { name: 'Disk I/O Utilization' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query:
                  'rate(node_disk_io_time_seconds_total{job="node",instance="$instance",device!~"^(md\\\\d+$|dm-)"}[$interval])',
              },
            },
          ],
          unit: { kind: 'Percent' },
        },
      },
      filesystemFullness: {
        kind: 'LineChart',
        display: { name: 'Filesystem Fullness' },
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
    },
    layouts: {
      main: {
        kind: 'grid',
        options: {
          children: [
            // Row 1
            [
              { width: 2, content: { $ref: '#/panels/gaugeEx' } },
              { width: 2, content: { $ref: '#/panels/gaugeExAlt' } },
              { width: 2, content: { $ref: '#/panels/emptyExample' } },
              { width: 2, content: { $ref: '#/panels/emptyExample2' } },
            ],
            // Row 2
            [
              { width: 1, content: { $ref: '#/panels/cpu' } },
              { width: 1, content: { $ref: '#/panels/memory' } },
            ],
            // Row 2
            [
              { width: 1, content: { $ref: '#/panels/diskIO' } },
              { width: 1, content: { $ref: '#/panels/filesystemFullness' } },
            ],
          ],
        },
      },
    },
    entrypoint: {
      $ref: '#/layouts/main',
    },
  },
};

export default nodeExporterDashboard;
