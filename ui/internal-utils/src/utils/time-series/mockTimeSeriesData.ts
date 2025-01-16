// Copyright 2024 The Perses Authors
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

import { TimeSeries, TimeSeriesData, TimeSeriesValueTuple } from '@perses-dev/core';
import { PanelData } from '@perses-dev/plugin-system';

/*
 * Mock time series panel data using example data from queries:
 * rpc_durations_histogram_seconds_bucket
 * rate(caddy_http_request_duration_seconds_bucket[$interval])
 *
 * Similar to mockTimeSeriesResponseWithManySeries, but returning
 * TimeSeriesData instead of a Prometheus response.
 */
export function mockTimeSeriesPanelDataWithManySeries({
  query,
  startTimeMs,
  endTimeMs,
  totalSeries = 16,
  totalDatapoints = 1000,
}: {
  query: string;
  startTimeMs: number;
  endTimeMs: number;
  totalSeries: number;
  totalDatapoints: number;
}): Array<PanelData<TimeSeriesData>> {
  const startTimeS = Math.floor(startTimeMs / 1000);
  const endTimeS = Math.floor(endTimeMs / 1000);
  const stepSize = Math.floor((endTimeS - startTimeS) / totalDatapoints);

  const series: TimeSeries[] = [];

  // Test data cycles back and forth depending on whether the series index is an even
  const exampleJobs = ['node', 'caddy'];
  const exampleMetric = ['rpc_durations_histogram_seconds_bucket', 'caddy_http_request_duration_seconds_bucket'];
  const exampleInstances = ['demo.do.prometheus.io:8996', 'rc-demo-environment/data/prom'];

  const GAP_BETWEEN_SERIES_MULTIPLIER = totalSeries * 1000;
  const STATIC_GAP = 10;

  for (let i = 0; i < totalSeries; i++) {
    const exampleIndex = i % 2;

    const name = exampleMetric[exampleIndex]!;
    const instance = exampleInstances[exampleIndex]!;
    const job = exampleJobs[exampleIndex]!;
    const le = `${i}.${exampleIndex}`;
    const timeSeries: Omit<TimeSeries, 'values'> = {
      name: `${name}{instance="${instance}",job="${job}",le="${le}"}`,
      formattedName: `${name}{instance="${instance}",job="${job}",le="${le}"}`,
      labels: {
        __name__: exampleMetric[exampleIndex]!,
        instance: exampleInstances[exampleIndex]!,
        job: exampleJobs[exampleIndex]!,
        le: `${i}.${exampleIndex}`,
      },
    };

    const values: TimeSeriesValueTuple[] = [];
    for (let j = 0; j < totalDatapoints; j++) {
      const TREND_UPWARDS_INCREMENT = j * 30;
      const timestamp = j < totalDatapoints - 1 ? startTimeS + j * stepSize : endTimeS;
      // TODO: better approach for realistic trends for test data
      const testValue = i * GAP_BETWEEN_SERIES_MULTIPLIER + STATIC_GAP + TREND_UPWARDS_INCREMENT;
      values.push([timestamp, 1000 + testValue]);
    }

    series.push({ ...timeSeries, values });
  }

  return [
    {
      definition: {
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query,
            },
          },
        },
      },
      data: {
        timeRange: {
          start: new Date(startTimeMs),
          end: new Date(endTimeMs),
        },
        stepMs: Math.max(stepSize, 60) * 1000,
        series: series,
        metadata: {
          notices: [],
          executedQueryString: query,
        },
      },
    },
  ];
}
