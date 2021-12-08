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
import { useRunningGraphQueries } from '../GraphQueryRunner';
import { getCommonTimeScale, getXValues, getYValues } from '../data-transform';

// Formatter for dates on the X axis
const XAXIS_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: 'numeric',
  hour12: false,
});

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
  const queries = useRunningGraphQueries();

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

  // Create the plot in the container div and recreate whenever data or options
  // change
  useLayoutEffect(() => {
    if (containerRef === null) return;
    if (data === undefined || options === undefined) return;

    const plot = new uPlot(options, data, containerRef);
    setPlot(plot);

    return () => {
      plot.destroy();
    };
  }, [containerRef, data, options]);

  return <Box ref={setContainerRef} sx={{ width, height, position: 'relative' }}></Box>;
}

export default UPlotChart;

// Helper function to generate a random color for a chart series based on its name
function getRandomColor(identifier: string): string {
  let hash = 0;
  for (let index = 0; index < identifier.length; index++) {
    hash = identifier.charCodeAt(index) + ((hash << 5) - hash);
  }
  // Use HSLA to only get random "bright" colors from this
  const color = `hsla(${~~(180 * hash)},50%,50%,0.8)`;
  return color;
}
