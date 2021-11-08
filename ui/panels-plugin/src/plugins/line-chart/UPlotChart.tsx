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

import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useState, useMemo, useLayoutEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { gcd } from 'mathjs';
import { AbsoluteTimeRange, TimeSeries } from '@perses-ui/core';
import {
  QueryState,
  useRunningTimeSeriesQueries,
} from './TimeSeriesQueryRunner';

export interface UPlotChartProps {
  width: number;
  height: number;
}

/**
 * Draws a line chart with `uplot` for the currently running time series queries.
 */
function UPlotChart(props: UPlotChartProps) {
  const { width, height } = props;
  const theme = useTheme();
  const queries = useRunningTimeSeriesQueries();

  const { data, options } = useMemo(() => {
    const timeScale = getCommonTimeScale(queries);
    if (timeScale === undefined) {
      return { data: undefined, options: undefined };
    }

    // Create initial data/options with x values and an empty series for the
    // x-axis values
    const series: uPlot.Options['series'] = [{}];
    const data: uPlot.AlignedData = [getXValues(timeScale)];

    for (const query of queries) {
      if (query.loading || query.data === undefined) continue;

      for (const timeSeries of query.data.series) {
        data.push(getYValues(timeSeries, timeScale));
        series.push({
          label: timeSeries.name,
          width: 2,
          stroke: getRandomColor(timeSeries.name),
          pxAlign: false,
        });
      }
    }

    const xAxis: uPlot.Axis = {
      grid: {
        stroke: theme.palette.grey['300'],
      },
      stroke: theme.palette.text.primary,
      values: (_, splits) => {
        return splits.map((xValue) => XAXIS_DATE_FORMAT.format(xValue));
      },
    };

    const yAxis: uPlot.Axis = {
      space: 24,
      grid: {
        stroke: theme.palette.grey['300'],
      },
      stroke: theme.palette.text.primary,
    };

    const options: uPlot.Options = {
      width,
      height,
      series,
      axes: [xAxis, yAxis],
      cursor: {
        x: false,
        y: false,
      },
      legend: {
        show: false,
      },
      pxAlign: false,
    };

    return {
      data,
      options,
    };
  }, [queries, width, height, theme]);

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>();
  const [, setPlot] = useState<uPlot | undefined>(undefined);

  useLayoutEffect(() => {
    if (containerRef === null) return;
    if (data === undefined || options === undefined) return;

    const plot = new uPlot(options, data, containerRef);
    setPlot(plot);

    return () => {
      plot.destroy();
    };
  }, [containerRef, data, options]);

  return (
    <Box
      ref={setContainerRef}
      sx={{ width, height, position: 'relative' }}
    ></Box>
  );
}

export default UPlotChart;

interface TimeScale {
  startMs: number;
  endMs: number;
  stepMs: number;
}

function getCommonTimeScale(queries: QueryState[]): TimeScale | undefined {
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
  // for the x axis
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

function getXValues(timeScale: TimeScale): number[] {
  const xValues: number[] = [];
  let timestamp = timeScale.startMs;
  while (timestamp <= timeScale.endMs) {
    xValues.push(timestamp);
    timestamp += timeScale.stepMs;
  }
  return xValues;
}

function getYValues(
  series: TimeSeries,
  timeScale: TimeScale
): Array<number | null> {
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

const XAXIS_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

function getRandomColor(identifier: string): string {
  let hash = 0;
  for (let index = 0; index < identifier.length; index++) {
    hash = identifier.charCodeAt(index) + ((hash << 5) - hash);
  }
  // Use HSLA to only get random "bright" colors from this
  const color = `hsla(${~~(180 * hash)},50%,50%,0.8)`;
  return color;
}
