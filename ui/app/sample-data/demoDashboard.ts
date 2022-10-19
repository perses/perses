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
    name: 'Demo Dashboard',
    project: 'perses',
    created_at: '2021-11-09',
    updated_at: '2021-11-09',
    version: 0,
  },
  spec: {
    datasource: { kind: 'Prometheus', name: 'PrometheusDemo', global: true },
    duration: '5m',
    variables: [
      {
        kind: 'ListVariable',
        spec: {
          name: 'job',
          allow_multiple: true,
          allow_all_value: true,
          default_value: 'node',
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
          name: 'instance',
          allow_all_value: true,
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'instance',
              matchers: ['up{job="$job"}'],
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
              values: ['1m', '5m'],
            },
          },
        },
      },
    ],
    panels: {
      seriesTest: {
        kind: 'Panel',
        spec: {
          display: { name: '1500+ Series', description: 'This is a line chart' },
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
                        query: 'rate(caddy_http_request_duration_seconds_bucket[$interval])',
                        // query: 'caddy_http_request_duration_seconds_bucket',
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
      seriesTestAlt: {
        kind: 'Panel',
        spec: {
          display: { name: '~130 Series', description: 'This is a line chart' },
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
                        query: 'rate(caddy_http_response_duration_seconds_sum[$interval])',
                        // query: 'histogram_quantile(0.9, rate(caddy_http_request_duration_seconds_bucket[$interval]))',
                      },
                    },
                  },
                },
              ],
              unit: { kind: 'Decimal', decimal_places: 2 },
              legend: {
                position: 'right',
              },
            },
          },
        },
      },
      basicEx: {
        kind: 'Panel',
        spec: {
          display: { name: 'Single Query' },
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
                          '1 - node_filesystem_free_bytes{job="node",instance=~"$instance",fstype!="rootfs",mountpoint!~"/(run|var).*",mountpoint!=""} / node_filesystem_size_bytes{job="node",instance=~"$instance"}',
                      },
                    },
                  },
                },
              ],
              unit: { kind: 'PercentDecimal', decimal_places: 0 },
              legend: {
                position: 'right',
              },
            },
          },
        },
      },
      legendEx: {
        kind: 'Panel',
        spec: {
          display: { name: 'Legend Example' },
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
                          'node_memory_MemTotal_bytes{job="node",instance=~"$instance"} - node_memory_MemFree_bytes{job="node",instance=~"$instance"} - node_memory_Buffers_bytes{job="node",instance=~"$instance"} - node_memory_Cached_bytes{job="node",instance=~"$instance"}',
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
                        query: 'node_memory_Buffers_bytes{job="node",instance=~"$instance"}',
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
                        query: 'node_memory_Cached_bytes{job="node",instance=~"$instance"}',
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
                        query: 'node_memory_MemFree_bytes{job="node",instance=~"$instance"}',
                      },
                    },
                  },
                },
              ],
              legend: {},
              unit: { kind: 'Bytes' },
            },
          },
        },
      },
      testNodeQuery: {
        kind: 'Panel',
        spec: {
          display: { name: 'Test Query', description: 'Description text' },
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
                        // query: 'node_load15{instance=~"$instance",job="node"}',
                        query: 'node_load15{instance=~"(demo.do.prometheus.io:9100)",job="node"}', // instance=~"(demo.do.prometheus.io:9100)"
                      },
                    },
                  },
                },
              ],
              // legend: {},
              unit: {
                kind: 'PercentDecimal',
                decimal_places: 1,
              },
            },
          },
        },
      },
      testQueryAlt: {
        kind: 'Panel',
        spec: {
          display: { name: 'Test Query Alt', description: 'Description text' },
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
                        // query: 'node_load1{instance=~"$instance",job="node"}',
                        query: 'node_load1{instance=~"(demo.do.prometheus.io:9100)",job="node"}',
                      },
                    },
                  },
                },
              ],
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
        },
      },
      cpu: {
        kind: 'Panel',
        spec: {
          display: { name: 'CPU', description: 'This is a line chart' },
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
                          'avg without (cpu)(rate(node_cpu_seconds_total{job="node",instance=~"$instance",mode!="idle"}[$interval]))',
                      },
                    },
                  },
                },
              ],
              unit: {
                kind: 'Decimal',
                decimal_places: 2,
              },
              legend: {},
            },
          },
        },
      },
      statSm: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Stat Sm',
            // description: 'This is a stat chart',
          },
          plugin: {
            kind: 'StatChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        'node_time_seconds{job="node",instance=~"$instance"} - node_boot_time_seconds{job="node",instance=~"$instance"}',
                    },
                  },
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
        },
      },
      statRAM: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'RAM Used',
            description: 'This is a stat chart',
          },
          plugin: {
            kind: 'StatChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        '100 - ((node_memory_MemAvailable_bytes{job="node",instance=~"$instance"} * 100) / node_memory_MemTotal_bytes{job="node",instance=~"$instance"})',
                    },
                  },
                },
              },
              calculation: 'LastNumber',
              unit: { kind: 'Percent' },
            },
          },
        },
      },
      statTotalRAM: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'RAM Total',
            description: 'This is a stat chart',
          },
          plugin: {
            kind: 'StatChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query: 'node_memory_MemTotal_bytes{job="node",instance=~"$instance"}',
                    },
                  },
                },
              },
              calculation: 'LastNumber',
              unit: {
                kind: 'Bytes',
                decimal_places: 1,
              },
            },
          },
        },
      },
      statMd: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Stat Md',
            // description: 'This is a stat chart',
          },
          plugin: {
            kind: 'StatChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        'avg(node_load15{job="node",instance=~"$instance"}) /  count(count(node_cpu_seconds_total{job="node",instance=~"$instance"}) by (cpu)) * 100',
                    },
                  },
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
        },
      },
      statLg: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Stat Lg',
            description: 'This is a stat chart',
          },
          plugin: {
            kind: 'StatChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        '(((count(count(node_cpu_seconds_total{job="node",instance=~"$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance=~"$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance=~"$instance"}) by (cpu))',
                    },
                  },
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
        },
      },
      gaugeEx: {
        kind: 'Panel',
        spec: {
          display: { name: 'Gauge Ex', description: 'This is a gauge chart' },
          plugin: {
            kind: 'GaugeChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        '(((count(count(node_cpu_seconds_total{job="node",instance=~"$instance"}) by (cpu))) - avg(sum by (mode)(rate(node_cpu_seconds_total{mode="idle",job="node",instance=~"$instance"}[$interval])))) * 100) / count(count(node_cpu_seconds_total{job="node",instance=~"$instance"}) by (cpu))',
                    },
                  },
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
      },
      gaugeAltEx: {
        kind: 'Panel',
        spec: {
          display: { name: 'Gauge Alt Ex', description: 'GaugeChart description text' },
          plugin: {
            kind: 'GaugeChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query: 'node_load15{instance=~"$instance",job="node"}',
                    },
                  },
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
        },
      },
      gaugeFormatTest: {
        kind: 'Panel',
        spec: {
          display: { name: 'Gauge Format Test' },
          plugin: {
            kind: 'GaugeChart',
            spec: {
              query: {
                kind: 'TimeSeriesQuery',
                spec: {
                  plugin: {
                    kind: 'PrometheusTimeSeriesQuery',
                    spec: {
                      query:
                        'node_time_seconds{job="node",instance=~"$instance"} - node_boot_time_seconds{job="node",instance=~"$instance"}',
                    },
                  },
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
              // width: 16,
              height: 6,
              content: { $ref: '#/spec/panels/legendEx' },
              // content: { $ref: '#/spec/panels/seriesTestAlt' },
              // content: { $ref: '#/spec/panels/seriesTest' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              // content: { $ref: '#/spec/panels/seriesTestAlt' },
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
              // content: { $ref: '#/spec/panels/cpu' },
              content: { $ref: '#/spec/panels/testNodeQuery' },
            },
            {
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              content: { $ref: '#/spec/panels/testQueryAlt' },
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

export default demoDashboard;
