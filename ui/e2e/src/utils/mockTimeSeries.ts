// Copyright 2023 The Perses Authors
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

import { PrometheusDatasource } from '@perses-dev/prometheus-plugin';

type PrometheusClient = ReturnType<typeof PrometheusDatasource['createClient']>;
type RangeQuery = Awaited<ReturnType<PrometheusClient['rangeQuery']>>;

type MockStableValueResultConfig = {
  metric: Record<string, string>;
  value: string;
};

type MockStableValueConfig = {
  metrics: MockStableValueResultConfig[];
  startTimeMs: number;
  endTimeMs: number;
  count?: number;
};

export function mockTimeSeriesResponseWithStableValue({
  metrics,
  startTimeMs,
  endTimeMs,
  count = 1000,
}: MockStableValueConfig): RangeQuery {
  // Taking time in as milliseconds because that's the unit generated by Date.now
  // in JS (i.e. mostly what the test code is going). Converting to seconds because
  // that's the unit used in prometheus responses.
  const startTimeS = Math.floor(startTimeMs / 1000);
  const endTimeS = Math.floor(endTimeMs / 1000);
  const stepSize = Math.floor((endTimeS - startTimeS) / count);

  return {
    status: 'success',
    data: {
      resultType: 'matrix',
      result: metrics.map(({ metric, value }) => {
        return {
          metric,
          values: [...Array(count)].map((_, i) => {
            // Use the end time for the last item to make sure we include it in
            // cases where the step size would lead to a lower value because of
            // rounding.
            const timestamp = i < count - 1 ? startTimeS + i * stepSize : endTimeS;

            return [timestamp, value];
          }),
        };
      }),
    },
  };
}

// Testing TimeSeriesQuery plugins that can return null values
export function mockTimeSeriesResponseWithNullValues(): RangeQuery {
  return {
    status: 'success',
    data: {
      resultType: 'matrix',
      result: [
        {
          metric: {},
          values: [
            [1677511940, '1'],
            [1677511941, '1'],
            [1677511942, '1'],
            [1677511943, '1'],
            [1677511944, '1'],
            [1677511945, '1'],
            [1677511946, '1'],
            [1677511947, '1'],
            [1677511948, '1'],
            [1677511949, null],
            [1677511950, null],
            [1677511951, null],
            [1677511952, null],
            [1677511953, null],
            [1677511954, '1'],
            [1677511955, '1'],
            [1677511956, '1'],
            [1677511957, '1'],
            [1677511958, '1'],
            [1677511959, '1'],
            [1677511960, '1'],
            [1677511961, '1'],
            [1677511962, '1'],
            [1677511963, '1'],
            [1677511964, '1'],
            [1677511965, '1'],
            [1677511966, '1'],
            [1677511967, '1'],
            [1677511968, '1'],
            [1677511969, '1'],
            [1677511970, '1'],
            [1677511971, '1'],
            [1677511972, '1'],
            [1677511973, '1'],
            [1677511974, '1'],
            [1677511975, '1'],
            [1677511976, '1'],
            [1677511977, '1'],
            [1677511978, '1'],
            [1677511979, '1'],
            [1677511980, '1'],
            [1677511981, '1'],
            [1677511982, '1'],
            [1677511983, '1'],
            [1677511984, '1'],
            [1677511985, '1'],
            [1677511986, '1'],
            [1677511987, '1'],
            [1677511988, '1'],
            [1677511989, '1'],
            [1677511990, '1'],
            [1677511991, '1'],
            [1677511992, '1'],
            [1677511993, '1'],
            [1677511994, '1'],
            [1677511995, '1'],
            [1677511996, '1'],
            [1677511997, '1'],
            [1677511998, '1'],
            [1677511999, '1'],
            [1677512000, '1'],
          ],
        },
      ],
    },
  };
}
