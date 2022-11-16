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

import { useMemo, useState } from 'react';
import { merge } from 'lodash-es';
import { PanelProps, useTimeSeriesQueries, useTimeRange } from '@perses-dev/plugin-system';
import type { GridComponentOption } from 'echarts';
import { Box, Skeleton } from '@mui/material';
import { LineChart, EChartsDataFormat, ZoomEventData, Legend } from '@perses-dev/components';
import { useSuggestedStepMs } from '../../model/time';
import { StepOptions, ThresholdColors, ThresholdColorsPalette } from '../../model/thresholds';
import { TimeSeriesChartOptions, DEFAULT_LEGEND, DEFAULT_UNIT } from './time-series-chart-model';
import {
  getLineSeries,
  getThresholdSeries,
  getCommonTimeScale,
  getYValues,
  getXValues,
  EMPTY_GRAPH_DATA,
} from './utils/data-transform';
import { getRandomColor } from './utils/palette-gen';

export type TimeSeriesChartProps = PanelProps<TimeSeriesChartOptions>;

export function TimeSeriesChartPanel(props: TimeSeriesChartProps) {
  const {
    spec: { queries, thresholds },
    contentDimensions,
  } = props;

  // popuate default 'position' and other future properties
  const legend = props.spec.legend ? merge({}, DEFAULT_LEGEND, props.spec.legend) : undefined;

  const unit = props.spec.unit ?? DEFAULT_UNIT;

  // TODO: change to array, support multi select on Shift-click
  const [selectedSeriesName, setSelectedSeriesName] = useState<string | null>(null);

  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const queryResults = useTimeSeriesQueries(queries, { suggestedStepMs });

  const { setTimeRange } = useTimeRange();

  const onLegendItemClick = (seriesName: string) => {
    setSelectedSeriesName((current) => {
      if (current === null || current !== seriesName) {
        return seriesName;
      }
      return null;
    });
  };

  // populate series data based on query results
  const { graphData, loading } = useMemo(() => {
    const timeScale = getCommonTimeScale(queryResults);
    if (timeScale === undefined) {
      for (const query of queryResults) {
        // If any query is successful, we will not show error (due to timeScale check)
        if (query.error) throw query.error;
      }
      return {
        loading: queryResults.every((result) => result.isLoading),
        graphData: EMPTY_GRAPH_DATA,
      };
    }

    const graphData: EChartsDataFormat = {
      timeSeries: [],
      xAxis: [],
      legendItems: [],
      rangeMs: timeScale.endMs - timeScale.startMs,
    };
    const xAxisData = [...getXValues(timeScale)];

    let queriesFinished = 0;
    for (const query of queryResults) {
      // Skip queries that are still loading and don't have data
      if (query.isLoading || query.data === undefined) continue;

      for (const timeSeries of query.data.series) {
        const formattedSeriesName = timeSeries.formattedName ?? timeSeries.name;
        const yValues = getYValues(timeSeries, timeScale);
        const lineSeries = getLineSeries(timeSeries.name, formattedSeriesName, yValues, selectedSeriesName);
        if (selectedSeriesName === null || selectedSeriesName === timeSeries.name) {
          graphData.timeSeries.push(lineSeries);
        }
        if (legend && graphData.legendItems) {
          graphData.legendItems.push({
            id: timeSeries.name, // TODO: should query generate an id instead of using full name here and in getRandomColor?
            label: formattedSeriesName,
            isSelected: selectedSeriesName === timeSeries.name,
            color: getRandomColor(timeSeries.name),
            onClick: () => onLegendItemClick(timeSeries.name),
          });
        }
      }
      queriesFinished++;
    }
    graphData.xAxis = xAxisData;

    if (thresholds && thresholds.steps) {
      const defaultThresholdColor = thresholds.default_color ?? ThresholdColors.RED;
      thresholds.steps.forEach((step: StepOptions, index: number) => {
        const stepPaletteColor = ThresholdColorsPalette[index] ?? defaultThresholdColor;
        const thresholdLineColor = step.color ?? stepPaletteColor;
        const stepOption: StepOptions = {
          color: thresholdLineColor,
          value: step.value,
        };
        const thresholdName = step.name ?? `Threshold ${index + 1} `;
        // TODO: switch back to markLine once alternate tooltip created
        const thresholdData = Array(xAxisData.length).fill(step.value);
        const thresholdLineSeries = getThresholdSeries(thresholdName, thresholdData, stepOption);
        graphData.timeSeries.push(thresholdLineSeries);
      });
    }

    return {
      graphData,
      loading: queriesFinished === 0,
    };
  }, [queryResults, thresholds, selectedSeriesName, legend]);

  if (contentDimensions === undefined) {
    return null;
  }

  if (loading === true) {
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

  const legendWidth = legend && legend.position === 'right' ? 200 : contentDimensions.width;
  const legendHeight = legend && legend.position === 'right' ? contentDimensions.height : 35;

  // override default spacing, see: https://echarts.apache.org/en/option.html#grid.right
  const gridOverrides: GridComponentOption = {
    right: legend && legend.position === 'right' ? legendWidth : 20,
  };

  const lineChartHeight =
    legend && legend.position === 'bottom' && graphData.legendItems && graphData.legendItems.length > 0
      ? contentDimensions.height - legendHeight
      : contentDimensions.height;

  const handleDataZoom = (event: ZoomEventData) => {
    // TODO: add ECharts transition animation on zoom
    setTimeRange({ start: new Date(event.start), end: new Date(event.end) });
  };

  return (
    <>
      <LineChart
        height={lineChartHeight}
        data={graphData}
        unit={unit}
        grid={gridOverrides}
        onDataZoom={handleDataZoom}
      />
      {legend && graphData.legendItems && (
        <Legend width={legendWidth} height={legendHeight} options={legend} data={graphData.legendItems} />
      )}
    </>
  );
}
