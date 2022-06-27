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

const nodeExporterDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Node Stats',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
    version: 0,
  },
  spec: {
    datasource: { kind: 'Prometheus', name: 'PrometheusDemo', global: true },
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
      },
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
      },
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
      },
    },
    panels: {
      gaugeCpuBusy: {
        kind: 'GaugeChart',
        display: { name: 'CPU Busy' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '(((count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance="$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            // default_color: '#000', // optional
            steps: [
              {
                value: 85,
                // color: '#800080', // optional, overrides defaultWarningColor
              },
              {
                value: 95,
                // color: '#0000FF', // optional, overrides defaultAlertColor
              },
            ],
          },
        },
      },
      gaugeSystemLoad: {
        kind: 'GaugeChart',
        display: { name: 'Sys Load (5m avg)' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'avg(node_load5{job="node",instance="$instance"}) /  count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu)) * 100',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            steps: [
              {
                value: 85,
              },
              {
                value: 95,
              },
            ],
          },
        },
      },
      gaugeSystemLoadAlt: {
        kind: 'GaugeChart',
        display: { name: 'Sys Load (15m avg)' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'avg(node_load15{job="node",instance="$instance"}) /  count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu)) * 100',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            steps: [
              {
                value: 85,
              },
              {
                value: 95,
              },
            ],
          },
        },
      },
      gaugeRam: {
        kind: 'GaugeChart',
        display: { name: 'RAM Used' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '100 - ((node_memory_MemAvailable_bytes{job="node",instance="$instance"} * 100) / node_memory_MemTotal_bytes{job="node",instance="$instance"})',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            steps: [
              {
                value: 80,
              },
              {
                value: 90,
              },
            ],
          },
        },
      },
      gaugeSwap: {
        kind: 'GaugeChart',
        display: { name: 'SWAP Used' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '((node_memory_SwapTotal_bytes{job="node",instance="$instance"} - node_memory_SwapFree_bytes{job="node",instance="$instance"}) / (node_memory_SwapTotal_bytes{job="node",instance="$instance"} )) * 100',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            steps: [
              {
                value: 10,
              },
              {
                value: 25,
              },
            ],
          },
        },
      },
      gaugeRoot: {
        kind: 'GaugeChart',
        display: { name: 'Root FS Used' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '100 - ((node_filesystem_avail_bytes{job="node",instance="$instance",mountpoint="/",fstype!="rootfs"} * 100) / node_filesystem_size_bytes{job="node",instance="$instance",mountpoint="/",fstype!="rootfs"})',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Percent' },
          thresholds: {
            steps: [
              {
                value: 80,
              },
              {
                value: 90,
              },
            ],
          },
        },
      },
      statCores: {
        kind: 'StatChart',
        display: {
          name: 'CPU Cores',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query: 'count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Decimal' },
        },
      },
      statTest: {
        kind: 'StatChart',
        display: {
          name: 'System Uptime',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'node_time_seconds{job="node",instance="$instance"} - node_boot_time_seconds{job="node",instance="$instance"}',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Decimal' },
        },
      },
      statRAM: {
        kind: 'StatChart',
        display: {
          name: 'RAM Total',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query: 'node_memory_MemTotal_bytes{job="node",instance="$instance"}',
            },
          },
          calculation: 'LastNumber',
          unit: {
            kind: 'Bytes',
            decimal_places: 1,
          },
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
    layouts: [
      {
        kind: 'Grid',
        spec: {
          items: [
            {
              x: 0,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeCpuBusy' },
            },
            {
              x: 3,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeSystemLoad' },
            },
            {
              x: 6,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeSystemLoadAlt' },
            },
            {
              x: 9,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeRam' },
            },
            {
              x: 12,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeSwap' },
            },
            {
              x: 15,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/gaugeRoot' },
            },
            {
              x: 18,
              y: 0,
              width: 3,
              height: 2,
              content: { $ref: '#/spec/panels/statCores' },
            },
            {
              x: 18,
              y: 2,
              width: 3,
              height: 2,
              content: { $ref: '#/spec/panels/statTest' },
            },
            {
              x: 21,
              y: 0,
              width: 3,
              height: 4,
              content: { $ref: '#/spec/panels/statRAM' },
            },
          ],
        },
      },
      {
        kind: 'Grid',
        spec: {
          items: [
            // First Row
            {
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/cpu' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/memory' },
            },
            // Second Row
            {
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/diskIO' },
            },
            {
              x: 12,
              y: 6,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/filesystemFullness' },
            },
          ],
        },
      },
    ],
  },
};

export default nodeExporterDashboard;
