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
    duration: '6h',
    variables: [
      {
        name: 'job',
        kind: 'TextVariable',
        options: {
          value: 'node',
        },
      },
      {
        name: 'instance',
        kind: 'TextVariable',
        options: {
          value: 'demo.do.prometheus.io:9100',
        },
      },
      {
        name: 'interval',
        kind: 'TextVariable',
        options: {
          value: '1m',
        },
      },
    ],
    panels: {
      markdownEx: {
        kind: 'Markdown',
        display: {
          name: 'Dashboard Team Overview',
          description: 'This is a markdown panel',
        },
        options: {
          text: "## Dashboard Team!\nOn this page, you'll find charts used by the dashboard team.\n\n```\n{ look: 'at this code' }\n```\n\n1. One\n2. Two\n3. Three\n\n[check the internet again](https://www.google.com)\n| Dashboard | Link |\n| :----------- | :----------- |\n| Dashboard 1 | [link](www.google.com) |\n| Dashboard 2 | [link](www.google.com) | \n\n<script>alert('xss');</script>\n> Will this <a \n> href='javascript:alert()'>block-quote attack work?</a>\n\n<h1>Will this header be here?</h1><a href='www.google.com'>Will this regular link be here?</a> <a href='javascript:alert('xss')>Will this javascript link be here?</a>\n\n",
        },
      },
      seriesTest: {
        kind: 'LineChart',
        display: { name: '1500+ Series', description: 'This is a line chart' },
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
        display: { name: '~130 Series', description: 'This is a line chart' },
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
          unit: {
            kind: 'Decimal',
            decimal_places: 4,
          },
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
          unit: {
            kind: 'PercentDecimal',
            decimal_places: 0,
          },
        },
      },
      legendEx: {
        kind: 'LineChart',
        display: { name: 'Legend Example' },
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
          show_legend: true,
          unit: { kind: 'Bytes' },
        },
      },
      doubleQueries: {
        kind: 'LineChart',
        display: { name: 'Thresholds Example', description: 'Description text' },
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
              },
            },
          ],
          show_legend: false,
          unit: {
            kind: 'PercentDecimal',
            decimal_places: 1,
          },
          thresholds: {
            // default_color: '#000', // optional
            steps: [
              {
                value: 0.4,
                name: 'Alert: Warning condition example',
                // color: '#FFFFFF',
              },
              {
                value: 0.75,
                name: 'Alert: Critical condition example',
                // color: '#0000FF', // blue
              },
            ],
          },
        },
      },
      cpu: {
        kind: 'LineChart',
        display: { name: 'CPU', description: 'This is a line chart' },
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
          unit: {
            kind: 'Decimal',
            decimal_places: 2,
          },
          show_legend: true,
        },
      },
      statSm: {
        kind: 'StatChart',
        display: {
          name: 'Stat Sm',
          // description: 'This is a stat chart',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'node_time_seconds{job="node",instance="$instance"} - node_boot_time_seconds{job="node",instance="$instance"}',
            },
          },
          calculation: 'Mean',
          unit: {
            kind: 'Decimal',
            decimal_places: 1,
            abbreviate: true,
          },
        },
      },
      statRAM: {
        kind: 'StatChart',
        display: {
          name: 'RAM Used',
          description: 'This is a stat chart',
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
          description: 'This is a stat chart',
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
      statMd: {
        kind: 'StatChart',
        display: {
          name: 'Stat Md',
          // description: 'This is a stat chart',
        },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'avg(node_load15{job="node",instance="$instance"}) /  count(count(node_cpu_seconds_total{job="node",instance="$instance"}) by (cpu)) * 100',
            },
          },
          calculation: 'Sum',
          unit: {
            kind: 'Decimal',
            decimal_places: 2,
            abbreviate: true,
          },
          sparkline: {
            color: '#e65013', // red
            width: 1.5,
          },
        },
      },
      statLg: {
        kind: 'StatChart',
        display: {
          name: 'Stat Lg',
          description: 'This is a stat chart',
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
            kind: 'Percent', // 'Percent', 'Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years',
          },
          sparkline: {
            area_opacity: 0.2,
          },
        },
      },
      gaugeEx: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Ex', description: 'This is a gauge chart' },
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
      gaugeAltEx: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Alt Ex', description: 'GaugeChart description text' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query: 'node_load15{instance="$instance",job="node"}',
            },
          },
          calculation: 'LastNumber',
          unit: {
            kind: 'PercentDecimal',
            decimal_places: 1,
          },
          thresholds: {
            // default_color: '#000', // optional
            steps: [
              {
                value: 0.5,
                name: 'Alert: Warning condition example',
                // color: '#FFFFFF',
              },
              {
                value: 0.75,
                name: 'Alert: Critical condition example',
                // color: '#0000FF', // blue
              },
            ],
          },
        },
      },
      gaugeFormatTest: {
        kind: 'GaugeChart',
        display: { name: 'Gauge Format Test' },
        options: {
          query: {
            kind: 'PrometheusGraphQuery',
            options: {
              query:
                'node_time_seconds{job="node",instance="$instance"} - node_boot_time_seconds{job="node",instance="$instance"}',
            },
          },
          calculation: 'LastNumber',
          unit: {
            kind: 'Decimal', // 'Decimal'
          },
          max: 95000000,
          thresholds: {
            steps: [
              {
                value: 71000000,
              },
              {
                value: 82000000,
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
              content: { $ref: '#/spec/panels/markdownEx' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/legendEx' },
            },
            {
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/seriesTestAlt' },
            },
            {
              x: 12,
              y: 6,
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
              open: false,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/legendEx' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/basicEx' },
            },
            {
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/basicEx' },
            },
            {
              x: 12,
              y: 6,
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
            title: 'Row 3',
            collapse: {
              open: false,
            },
          },
          items: [
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
              open: false,
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
              // content: { $ref: '#/spec/panels/gaugeEx' },
              // content: { $ref: '#/spec/panels/gaugeAltEx' },
              content: { $ref: '#/spec/panels/gaugeFormatTest' },
            },
          ],
        },
      },
    ],
  },
};

export default benchmarkDashboard;
