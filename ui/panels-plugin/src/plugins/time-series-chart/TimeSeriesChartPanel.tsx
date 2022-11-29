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
import { LineChart, EChartsDataFormat, ZoomEventData, Legend, YAxisLabel } from '@perses-dev/components';
import { useSuggestedStepMs } from '../../model/time';
import { StepOptions, ThresholdColors, ThresholdColorsPalette } from '../../model/thresholds';
import {
  TimeSeriesChartOptions,
  DEFAULT_LEGEND,
  DEFAULT_UNIT,
  DEFAULT_VISUAL,
  DEFAULT_Y_AXIS,
} from './time-series-chart-model';
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
    spec: { queries, thresholds, y_axis },
    contentDimensions,
  } = props;

  // popuate default 'position' and other future properties
  const legend = props.spec.legend ? merge({}, DEFAULT_LEGEND, props.spec.legend) : undefined;

  // TODO: eventually remove props.spec.unit, add support for y_axis_alt.unit
  let unit = DEFAULT_UNIT;
  if (props.spec.y_axis?.unit) {
    unit = props.spec.y_axis.unit;
  } else if (props.spec.unit) {
    unit = props.spec.unit;
  }

  // ensures there are fallbacks for unset properties since most
  // users should not need to customize visual display
  const visual = merge({}, DEFAULT_VISUAL, props.spec.visual);

  // convert Perses dashboard format to be ECharts compatible
  const yAxis = {
    show: y_axis?.show ?? DEFAULT_Y_AXIS.show,
    min: y_axis?.min, // leaves min and max undefined by default to let ECharts calcualate
    max: y_axis?.max,
  };

  const [selectedSeriesNames, setSelectedSeriesNames] = useState<string[]>([]);

  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const queryResults = useTimeSeriesQueries(queries, { suggestedStepMs });
  const loading = queryResults.some((result) => result.isLoading);
  const hasData = queryResults.some((result) => result.data && Array.from(result.data.series).length > 0);

  const { setTimeRange } = useTimeRange();

  const onLegendItemClick = (e: React.MouseEvent<HTMLLIElement, MouseEvent>, seriesName: string) => {
    const isModifiedClick = e.metaKey || e.shiftKey;

    setSelectedSeriesNames((current) => {
      const isSelected = current.includes(seriesName);

      // Clicks with modifier key can select multiple items.
      if (isModifiedClick) {
        if (isSelected) {
          // Modified click on already selected item. Remove that item.
          return current.filter((name) => name !== seriesName);
        }

        // Modified click on not-selected item. Add it.
        return [...current, seriesName];
      }

      if (isSelected) {
        // Clicked item was already selected. Unselect it.
        return [];
      }

      // Select clicked item.
      return [seriesName];
    });
  };

  // Populate series data based on query results
  const { graphData } = useMemo(() => {
    const timeScale = getCommonTimeScale(queryResults);
    if (timeScale === undefined) {
      return {
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

    for (const result of queryResults) {
      // Skip queries that are still loading and don't have data
      if (result.isLoading || result.data === undefined) continue;

      for (const timeSeries of result.data.series) {
        const formattedSeriesName = timeSeries.formattedName ?? timeSeries.name;
        const yValues = getYValues(timeSeries, timeScale);
        const lineSeries = getLineSeries(timeSeries.name, formattedSeriesName, yValues, visual);
        const isSelected = selectedSeriesNames.includes(timeSeries.name);

        if (!selectedSeriesNames.length || isSelected) {
          graphData.timeSeries.push(lineSeries);
        }
        if (legend && graphData.legendItems) {
          graphData.legendItems.push({
            id: timeSeries.name, // TODO: should query generate an id instead of using full name here and in getRandomColor?
            label: formattedSeriesName,
            isSelected,
            color: getRandomColor(timeSeries.name),
            onClick: (e) => onLegendItemClick(e, timeSeries.name),
          });
        }
      }
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
    };
  }, [queryResults, thresholds, selectedSeriesNames, legend, visual]);

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

  // At this point, we have a response from the backend for all queries. (We're past loading === true).
  // If we don't data from any of the queries, then check if we want to show an error.
  // Put another way: If any queries have data, even if other queries failed, we will show the data (not the error).
  // Unfortunately, partial errors get swallowed in this case.
  // This could be refactored when someone takes a look at validation and error-handling.
  if (!hasData) {
    for (const result of queryResults) {
      if (result.error) throw result.error;
    }
  }

  const legendWidth = legend && legend.position === 'right' ? 200 : contentDimensions.width;
  const legendHeight = legend && legend.position === 'right' ? contentDimensions.height : 35;

  // override default spacing, see: https://echarts.apache.org/en/option.html#grid
  const gridLeft = y_axis && y_axis.label ? 30 : 20;
  const gridOverrides: GridComponentOption = {
    left: !yAxis.show ? 0 : gridLeft,
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
      {y_axis && y_axis.show && y_axis.label && <YAxisLabel name={y_axis.label} height={contentDimensions.height} />}
      <LineChart
        height={lineChartHeight}
        data={graphData}
        yAxis={yAxis}
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
