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

const cadvisor: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'Kubelet - cAdvisor',
  },
  spec: {
    datasource: { name: 'PromLabs Prometheus' },
    // TODO: Should duration actually be a time range?
    duration: '3h',
    variables: {
      cluster: {
        kind: 'PrometheusLabelValues',
        options: {
          label_name: 'k8s_cluster',
          match: ['container_cpu_usage_seconds_total'],
        },
        display: {
          label: 'Cluster',
        },
        selection: {
          default_value: 'production-a',
        },
      } as AnyVariableDefinition,
      node: {
        kind: 'PrometheusLabelValues',
        options: {
          label_name: 'instance',
          match: ['{job="node"}'],
        },
        display: {
          label: 'Node',
        },
        selection: {
          default_value: ['$__all'],
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
      pod: {
        kind: 'PrometheusLabelValues',
        options: {
          label_name: 'pod',
          match: [
            'container_network_receive_bytes_total{k8s_cluster="$cluster"}',
          ],
        },
        display: {
          label: 'Pod Group',
        },
        selection: {
          default_value: ['gateway'],
          all_value: '.+',
        },
        capturing_regexp:
          '/((?:[^-]|(?:-(?!(?:[a-z0-9]{8,10}(?:-|$))|(?:[a-z0-9]{4,5}$))))*)/',
      } as AnyVariableDefinition,
    },
    panels: {
      uptime: {
        kind: 'StatChart',
        display: { name: 'Uptime' },
        options: {
          query: {
            kind: 'PrometheusRangeChartQuery',
            options: {
              query: 'avg(time() - node_boot_time_seconds{instance=~"$node"})',
            },
          },
          calculation: 'LastNumber',
          unit: { kind: 'Seconds' },
        },
      },
      containers: {
        kind: 'StatChart',
        display: { name: 'Containers' },
        options: {
          query: {
            kind: 'PrometheusRangeChartQuery',
            options: {
              query:
                'count(rate(container_last_seen{name=~".+",instance=~"$node",pod=~"$pod.*"}[$interval]))',
            },
          },
          calculation: 'LastNumber',
          unit: undefined,
        },
      },
      load: {
        kind: 'StatChart',
        display: { name: 'Load' },
        options: {
          query: {
            kind: 'PrometheusRangeChartQuery',
            options: {
              query:
                'avg(node_load1{instance=~"$node"}) /  count(count(node_cpu_seconds_total{instance=~"$node"}) by (cpu))',
            },
          },
          calculation: 'Mean',
          unit: { kind: 'PercentDecimal', decimal_places: 0 },
        },
      },
      persistentVolumeUsage: {
        kind: 'EmptyChart',
        display: { name: 'Persistent Volume Usage' },
        options: {},
      },
      cpuUsage: {
        kind: 'EmptyChart',
        display: { name: 'CPU Usage' },
        options: {},
      },
      networkTraffic: {
        kind: 'EmptyChart',
        display: { name: 'Network Traffic' },
        options: {},
      },
      memory: { kind: 'EmptyChart', display: { name: 'Memory' }, options: {} },
      diskSpace: {
        kind: 'EmptyChart',
        display: { name: 'Disk Space' },
        options: {},
      },
      cpuUsagePerPod: {
        kind: 'EmptyChart',
        display: { name: 'CPU Usage per Pod' },
        options: {},
      },
      memoryUsagePerPod: {
        kind: 'EmptyChart',
        display: { name: 'Memory Usage per Pod' },
        options: {},
      },
      receivedNetworkTrafficPerPod: {
        kind: 'EmptyChart',
        display: { name: 'Received Network Traffic per Pod' },
        options: {},
      },
      sentNetworkTrafficPerPod: {
        kind: 'EmptyChart',
        display: { name: 'Sent Network Traffic per Pod' },
        options: {},
      },
      cpuLimitUtilization: {
        kind: 'EmptyChart',
        display: { name: 'CPU Limit Utilization' },
        options: {},
      },
      topCpuUsage: {
        kind: 'EmptyChart',
        display: { name: 'Top CPU Usage' },
        options: {},
      },
      topCpuLimits: {
        kind: 'EmptyChart',
        display: { name: 'Top CPU Limits' },
        options: {},
      },
      memoryLimitUtilization: {
        kind: 'EmptyChart',
        display: { name: 'Memory Limit Utilization' },
        options: {},
      },
      topMemoryUsage: {
        kind: 'EmptyChart',
        display: { name: 'Top Memory Usage' },
        options: {},
      },
      topMemoryLimits: {
        kind: 'EmptyChart',
        display: { name: 'Top Memory Limits' },
        options: {},
      },
      diskLimitUtilization: {
        kind: 'EmptyChart',
        display: { name: 'Disk Limit Utilization' },
        options: {},
      },
      topDiskUsage: {
        kind: 'EmptyChart',
        display: { name: 'Top Disk Usage' },
        options: {},
      },
      topDiskLimits: {
        kind: 'EmptyChart',
        display: { name: 'Top Disk Limits' },
        options: {},
      },
    },
    layouts: {
      main: {
        kind: 'grid',
        options: {
          children: [
            // Row 1
            [
              { width: 1, content: { $ref: '#/panels/uptime' } },
              { width: 1, content: { $ref: '#/panels/containers' } },
              { width: 2, content: { $ref: '#/panels/load' } },
              { width: 4, content: { $ref: '#/panels/persistentVolumeUsage' } },
            ],
            // Row 2
            [
              { width: 2, content: { $ref: '#/panels/cpuUsage' } },
              { width: 2, content: { $ref: '#/panels/networkTraffic' } },
              { width: 1, content: { $ref: '#/panels/memory' } },
              { width: 1, content: { $ref: '#/panels/diskSpace' } },
            ],
            // Row 3
            [
              { width: 1, content: { $ref: '#/panels/cpuUsagePerPod' } },
              { width: 1, content: { $ref: '#/panels/memoryUsagePerPod' } },
            ],
            // Row 4
            [
              {
                width: 1,
                content: { $ref: '#/panels/receivedNetworkTrafficPerPod' },
              },
              {
                width: 1,
                content: { $ref: '#/panels/sentNetworkTrafficPerPod' },
              },
            ],
            // Row 5
            [
              { width: 1, content: { $ref: '#/panels/cpuLimitUtilization' } },
              { width: 1, content: { $ref: '#/panels/topCpuUsage' } },
              { width: 1, content: { $ref: '#/panels/topCpuLimits' } },
            ],
            // Row 6
            [
              {
                width: 1,
                content: { $ref: '#/panels/memoryLimitUtilization' },
              },
              { width: 1, content: { $ref: '#/panels/topMemoryUsage' } },
              { width: 1, content: { $ref: '#/panels/topMemoryLimits' } },
            ],
            // Row 7
            [
              { width: 1, content: { $ref: '#/panels/diskLimitUtilization' } },
              { width: 1, content: { $ref: '#/panels/topDiskUsage' } },
              { width: 1, content: { $ref: '#/panels/topDiskLimits' } },
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

export default cadvisor;
