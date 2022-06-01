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

import { AbsoluteTimeRange } from '@perses-dev/core';
import { EChartsTimeSeries } from '@perses-dev/components';
import { GraphSeries } from '@perses-dev/plugin-system';
import { gcd } from 'mathjs';
import { QueryState } from '../GraphQueryRunner';
import { getRandomColor } from '../utils/palette-gen';
import { StepOptions } from '../../../model/thresholds';

export interface TimeScale {
  startMs: number;
  endMs: number;
  stepMs: number;
}

export const OPTIMIZED_MODE_SERIES_LIMIT = 500;

/**
 * Given a list of running queries, calculates a common time scale for use on
 * the x axis (i.e. start/end dates and a step that is divisible into all of
 * the queries' steps).
 */
export function getCommonTimeScale(queries: QueryState[]): TimeScale | undefined {
  let timeRange: AbsoluteTimeRange | undefined = undefined;
  const steps: number[] = [];
  for (const { loading, data } of queries) {
    if (loading || data === undefined) continue;

    // Keep track of query steps so we can calculate a common one for the graph
    steps.push(data.stepMs);

    // If we don't have an overall time range yet, just start with this one
    if (timeRange === undefined) {
      timeRange = data.timeRange;
      continue;
    }

    // Otherwise, see if this query has a start or end outside of the current
    // time range
    if (data.timeRange.start < timeRange.start) {
      timeRange.start = data.timeRange.start;
    }
    if (data.timeRange.end > timeRange.end) {
      timeRange.end = data.timeRange.end;
    }
  }

  if (timeRange === undefined) return undefined;

  // Use the greatest common divisor of all step values as the overall step
  // for the x axis (or if only one query, just use that query's step value)
  let stepMs: number;
  if (steps.length === 1) {
    stepMs = steps[0] as number;
  } else {
    stepMs = gcd(...steps);
  }

  const startMs = timeRange.start.valueOf();
  const endMs = timeRange.end.valueOf();

  return { startMs, endMs, stepMs };
}

/**
 * Given a common time scale, generates an array of timestamp (in ms) values
 * for the x axis of a graph.
 */
export function getXValues(timeScale: TimeScale): number[] {
  const xValues: number[] = [];
  let timestamp = timeScale.startMs;
  while (timestamp <= timeScale.endMs) {
    xValues.push(timestamp);
    timestamp += timeScale.stepMs;
  }
  return xValues;
}

/**
 * Given a TimeSeries from a query and the time scale, gets the values for the
 * y axis of a graph, filling in any timestamps that are missing from the time
 * series data with `null` values.
 */
export function getYValues(series: GraphSeries, timeScale: TimeScale): Array<number | null> {
  let timestamp = timeScale.startMs;

  const yValues: Array<number | null> = [];
  for (const valueTuple of series.values) {
    // Fill in values up to the current series value timestamp with nulls
    while (timestamp < valueTuple[0]) {
      yValues.push(null);
      timestamp += timeScale.stepMs;
    }

    // Now add the current value since timestamp should match
    yValues.push(valueTuple[1]);
    timestamp += timeScale.stepMs;
  }

  // Add null values at the end of the series if necessary
  while (timestamp <= timeScale.endMs) {
    yValues.push(null);
    timestamp += timeScale.stepMs;
  }

  return yValues;
}

/**
 * Gets default ECharts line series option properties or returns threshold-specific styles
 * Note: markLine cannot be used since it does not update yAxis max / min
 */
export function getLineSeries(
  name: string,
  data: EChartsTimeSeries['data'],
  threshold?: StepOptions
): EChartsTimeSeries {
  if (threshold !== undefined) {
    return {
      type: 'line',
      name: name,
      data: data,
      color: threshold.color,
      label: {
        show: false,
      },
      lineStyle: {
        type: 'dashed',
        width: 1.5,
      },
      emphasis: {
        lineStyle: {
          width: 2,
        },
      },
    };
  }

  return {
    type: 'line',
    name: name,
    data: data,
    color: getRandomColor(name),
    sampling: 'lttb',
    progressiveThreshold: OPTIMIZED_MODE_SERIES_LIMIT,
  };
}
