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

import { PanelProps, useDataQueries } from '@perses-dev/plugin-system';
import { Box, Skeleton } from '@mui/material';
import { useMemo } from 'react';
import { TraceValue } from '@perses-dev/core';
import { EChartsOption, SeriesOption } from 'echarts';
import { ErrorAlert, useChartsTheme } from '@perses-dev/components';
import { Scatterplot } from './Scatterplot';
import { ScatterChartOptions } from './scatter-chart-model';

export interface EChartTraceValue extends Omit<TraceValue, 'startTimeUnixMs' | 'serviceStats'> {
  name: string;
  startTime: Date;
  spanCount: number;
  errorCount: number;
}

const generateErrorAlert = (message: string) => {
  const alertMessage = {
    name: message,
    message: message,
  };
  return (
    <div data-testid="ScatterChartPanel_ErrorAlert">
      <ErrorAlert error={alertMessage} />
    </div>
  );
};

export type ScatterChartPanelProps = PanelProps<ScatterChartOptions>;

/**
 * ScatterChartPanel receives data from the DataQueriesProvider and transforms it
 * into a `dataset` object that Apache ECharts can consume. Additionally,
 * data formatting is also dictated in this component. Formatting includes
 * datapoint size and color.
 *
 * Documentation for data structures accepted by Apache ECharts:
 *  https://echarts.apache.org/handbook/en/concepts/dataset
 *
 * Examples for scatter chart formatting in Apache ECharts:
 *  https://echarts.apache.org/examples/en/index.html#chart-type-scatter
 *
 * @returns a `ScatterPlot` component that contains an EChart which will handle
 * visualization of the data.
 */
export function ScatterChartPanel(props: ScatterChartPanelProps) {
  const { contentDimensions } = props;
  const { queryResults: traceResults, isLoading: traceIsLoading } = useDataQueries('TraceQuery');
  const chartsTheme = useChartsTheme();
  const defaultColor = chartsTheme.thresholds.defaultColor || 'blue';

  // Generate dataset
  // Transform Tempo API response to fit 'dataset' structure from Apache ECharts
  // https://echarts.apache.org/handbook/en/concepts/dataset
  const { dataset, maxSpanCount } = useMemo(() => {
    if (traceIsLoading) {
      return { dataset: [], maxSpanCount: 1 };
    }

    const dataset = [];
    let maxSpanCount = 1;
    for (const result of traceResults) {
      if (result.isLoading || result.data === undefined) continue;
      const dataSeries = result.data.traces.map((trace) => {
        let spanCount = 0;
        let errorCount = 0;
        for (const stats of Object.values(trace.serviceStats)) {
          spanCount += stats.spanCount;
          errorCount += stats.errorCount ?? 0;
        }
        if (spanCount > maxSpanCount) {
          maxSpanCount = spanCount;
        }

        const newTraceValue: EChartTraceValue = {
          ...trace,
          name: `${trace.rootServiceName}: ${trace.rootTraceName}`,
          startTime: new Date(trace.startTimeUnixMs), // convert unix epoch time to Date
          spanCount,
          errorCount,
        };
        return newTraceValue;
      });
      dataset.push({
        source: dataSeries,
      });
    }
    return { dataset, maxSpanCount };
  }, [traceIsLoading, traceResults]);

  // Formatting for the dataset
  // 1. Map x,y coordinates
  // 2. Datapoint size corresponds to the number of spans in a trace
  // 3. Color datapoint red if the trace contains an error
  const series = useMemo(() => {
    const seriesTemplate2: SeriesOption = {
      type: 'scatter',
      encode: {
        // Map to x-axis.
        x: 'startTime',
        // Map to y-axis.
        y: 'durationMs',
      },
      symbolSize: function (data) {
        // Changes datapoint to correspond to number of spans in a trace
        const maxScaleSymbolSize = 80;
        return (data.spanCount / maxSpanCount) * maxScaleSymbolSize;
      },
      itemStyle: {
        color: function (params) {
          const traceData: EChartTraceValue = params.data as EChartTraceValue;
          // If the trace contains an error, color the datapoint in red
          if (traceData.errorCount > 0) {
            return 'red';
          }
          // Else return default color
          return defaultColor;
        },
      },
    };

    // Each data set needs to have a corresponding series formatting object
    const series = [];
    for (let i = 0; i < dataset.length; i++) {
      series.push({ ...seriesTemplate2, datasetIndex: i });
    }
    return series;
  }, [dataset, defaultColor, maxSpanCount]);

  // Error check: specify an alert if no traces are returned from the query
  const traceData = traceResults[0]?.data;
  if (!traceIsLoading && traceData?.traces.length === 0) {
    const query = traceData?.metadata?.executedQueryString;
    return generateErrorAlert(`No traces found for the query: " ${query} " .`);
  }

  const options: EChartsOption = {
    dataset: dataset,
    series: series,
  };

  if (contentDimensions === undefined) return null;

  if (traceIsLoading === true) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        width={contentDimensions.width}
        height={contentDimensions.height}
      >
        <Skeleton variant="text" width={contentDimensions.width - 20} height={contentDimensions.height / 2} />
      </Box>
    );
  }

  return (
    <div data-testid="ScatterChartPanel_ScatterPlot">
      <Scatterplot width={contentDimensions.width} height={contentDimensions.height} options={options} />
    </div>
  );
}
