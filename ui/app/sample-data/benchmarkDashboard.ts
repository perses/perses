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

import { DashboardResource } from '@perses-dev/core';

const benchmarkDashboard: DashboardResource = {
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
          default_value: '1h',
        },
      },
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
      doubleQueries: {
        kind: 'LineChart',
        display: { name: 'Double Queries' },
        options: {
          queries: [
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'node_load15{instance="$instance",job="node"}',
              },
            },
            {
              kind: 'PrometheusGraphQuery',
              options: {
                query: 'node_load1{instance="$instance",job="node"}',
                // query: 'rate(caddy_http_response_duration_seconds_sum[$interval])',
              },
            },
          ],
          // unit: { kind: 'Bytes' },
        },
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
      statSm: {
        kind: 'StatChart',
        display: {
          name: 'Stat Sm',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '(((count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance="$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))',
            },
          },
          calculation: 'Sum',
          unit: {
            kind: 'Decimal',
            decimal_places: 2,
            suffix: 'kilogram', // https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-issanctionedsimpleunitidentifier
          },
          // sparkline: {},
          // thresholds: {
          //   default_color: '#EA4747', // red
          // },
        },
      },
      statRAM: {
        kind: 'StatChart',
        display: {
          name: 'RAM Used',
        },
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
        },
      },
      statTotalRAM: {
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
            kind: 'Decimal',
            suffix: 'byte',
          },
        },
      },
      statMd: {
        kind: 'StatChart',
        display: {
          name: 'Stat Md',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '(((count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance="$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))',
              // '((node_memory_SwapTotal_bytes{job="node",instance="$instance"} - node_memory_SwapFree_bytes{job="node",instance="$instance"}) / (node_memory_SwapTotal_bytes{job="node",instance="$instance"} )) * 100',
            },
          },
          calculation: 'Mean',
          unit: {
            kind: 'Decimal',
            decimal_places: 4,
            // suffix: 'celsius', // https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-issanctionedsimpleunitidentifier
          },
          thresholds: {
            default_color: '#EA4747',
          },
          sparkline: {
            line_color: '#FFE3E3',
            line_width: 1.5,
            line_opacity: 0.6,
            area_color: '#FFBABA',
            area_opacity: 0.4,
          },
        },
      },
      statLg: {
        kind: 'StatChart',
        display: {
          name: 'Stat Lg',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                '(((count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance="$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu))',
            },
          },
          calculation: 'Mean', // 'First', 'Last', 'LastNumber'
          unit: {
            kind: 'Decimal', // 'Percent', 'Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years'
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#unit_formatting
            suffix: 'gigabyte',
          },
          sparkline: {},
          thresholds: {
            default_color: '#1473E6', // blue
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
      gaugeEx: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Ex' },
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
                // color: '#800080',
              },
              {
                value: 95,
                // color: '#0000FF',
              },
            ],
          },
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        spec: {
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
              content: { $ref: '#/spec/panels/multiQueries' },
              // content: { $ref: '#/spec/panels/cpu' },
              // content: { $ref: '#/spec/panels/seriesTestAlt' },
              // content: { $ref: '#/spec/panels/seriesTest' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/basicEx' },
            },
          ],
        },
      },
      {
        kind: 'Grid',
        spec: {
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
              content: { $ref: '#/spec/panels/cpu' },
              // content: { $ref: '#/spec/panels/seriesTestAlt' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/doubleQueries' },
            },
          ],
        },
      },
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Row 3',
            collapse: {
              open: true,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 2,
              height: 2,
              content: { $ref: '#/spec/panels/statSm' },
            },
            {
              x: 0,
              y: 2,
              width: 2,
              height: 2,
              content: { $ref: '#/spec/panels/statRAM' },
            },
            {
              x: 0,
              y: 4,
              width: 2,
              height: 2,
              content: { $ref: '#/spec/panels/statTotalRAM' },
            },
            {
              x: 2,
              y: 0,
              width: 4,
              height: 6,
              content: { $ref: '#/spec/panels/statMd' },
            },
            {
              x: 6,
              y: 0,
              width: 10,
              height: 6,
              content: { $ref: '#/spec/panels/statLg' },
            },
            {
              x: 16,
              y: 0,
              width: 8,
              height: 6,
              content: { $ref: '#/spec/panels/gaugeEx' },
            },
          ],
        },
      },
    ],
  },
};

export default benchmarkDashboard;
