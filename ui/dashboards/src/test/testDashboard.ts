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

const testDashboard: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Node Stats',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
    version: 0,
  },
  spec: {
    duration: '24h',
    variables: [
      {
        kind: 'TextVariable',
        spec: {
          name: 'job',
          value: 'node',
        },
      },
      {
        kind: 'TextVariable',
        spec: {
          name: 'instance',
          value: 'demo.do.prometheus.io:9100',
        },
      },
      {
        kind: 'TextVariable',
        spec: {
          name: 'interval',
          value: '1m',
        },
      },
    ],
    panels: {
      cpu: {
        kind: 'Panel',
        spec: {
          display: { name: 'CPU' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query:
                          'avg without (cpu)(rate(node_cpu_seconds_total{job="node",instance="$instance",mode!="idle"}[$interval]))',
                      },
                    },
                  },
                },
              ],
              unit: { kind: '%' },
            },
          },
        },
      },
      memory: {
        kind: 'Panel',
        spec: {
          display: { name: 'Memory' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query:
                          'node_memory_MemTotal_bytes{job="node",instance="$instance"} - node_memory_MemFree_bytes{job="node",instance="$instance"} - node_memory_Buffers_bytes{job="node",instance="$instance"} - node_memory_Cached_bytes{job="node",instance="$instance"}',
                      },
                    },
                  },
                },
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query: 'node_memory_Buffers_bytes{job="node",instance="$instance"}',
                      },
                    },
                  },
                },
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query: 'node_memory_Cached_bytes{job="node",instance="$instance"}',
                      },
                    },
                  },
                },
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query: 'node_memory_MemFree_bytes{job="node",instance="$instance"}',
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
      // This panel is referenced in more than one layout below
      diskIO: {
        kind: 'Panel',
        spec: {
          display: { name: 'Disk I/O Utilization' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query:
                          'rate(node_disk_io_time_seconds_total{job="node",instance="$instance",device!~"^(md\\\\d+$|dm-)"}[$interval])',
                      },
                    },
                  },
                },
              ],
              unit: { kind: 'Percent' },
            },
          },
        },
      },
      filesystemFullness: {
        kind: 'Panel',
        spec: {
          display: { name: 'Filesystem Fullness' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query:
                          '1 - node_filesystem_free_bytes{job="node",instance="$instance",fstype!="rootfs",mountpoint!~"/(run|var).*",mountpoint!=""} / node_filesystem_size_bytes{job="node",instance="$instance"}',
                      },
                    },
                  },
                },
              ],
              unit: { kind: 'Percent' },
            },
          },
        },
      },
    },
    layouts: [
      // Regular Title, no collapse enabled
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'CPU Stats',
            collapse: {
              open: true,
            },
          },
          items: [
            // First Row
            {
              x: 0,
              y: 0,
              width: 12,
              height: 4,
              content: { $ref: '#/spec/panels/cpu' },
            },
            {
              x: 0,
              y: 5,
              width: 6,
              height: 2,
              content: { $ref: '#/spec/panels/diskIO' },
            },
          ],
        },
      },
      // No title,
      {
        kind: 'Grid',
        spec: {
          items: [
            {
              x: 8,
              y: 0,
              width: 8,
              height: 3,
              content: { $ref: '#/spec/panels/memory' },
            },
          ],
        },
      },
      // Collapsed
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Disk Stats',
            collapse: {
              open: false,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 6,
              height: 2,
              content: { $ref: '#/spec/panels/diskIO' },
            },
            {
              x: 18,
              y: 0,
              width: 6,
              height: 2,
              content: { $ref: '#/spec/panels/filesystemFullness' },
            },
          ],
        },
      },
    ],
  },
};

export default testDashboard;
