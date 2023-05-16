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

import { useState } from 'react';
import { merge } from 'lodash-es';
import { useDeepMemo, StepOptions, getXValues, getYValues, TimeSeries } from '@perses-dev/core';
import { PanelProps, useDataQueries, useTimeRange } from '@perses-dev/plugin-system';
import type { GridComponentOption } from 'echarts';
import { Box, Skeleton, useTheme } from '@mui/material';
import {
  DEFAULT_LEGEND,
  EChartsDataFormat,
  validateLegendSpec,
  Legend,
  LineChart,
  YAxisLabel,
  ZoomEventData,
  useChartsTheme,
} from '@perses-dev/components';
import produce from 'immer';
import {
  TimeSeriesChartOptions,
  DEFAULT_UNIT,
  DEFAULT_VISUAL,
  PANEL_HEIGHT_LG_BREAKPOINT,
  LEGEND_HEIGHT_SM,
  LEGEND_HEIGHT_LG,
} from './time-series-chart-model';
import {
  getLineSeries,
  getThresholdSeries,
  getCommonTimeScaleForQueries,
  EMPTY_GRAPH_DATA,
  convertPercentThreshold,
  convertPanelYAxis,
} from './utils/data-transform';
import { getSeriesColor } from './utils/palette-gen';

export type TimeSeriesChartProps = PanelProps<TimeSeriesChartOptions>;

// Using an "ALL" value to handle the case on first loading the chart where we
// want to select all, but do not want all of the legend items to be visually highlighted.
// This helps us differentiate those cases more clearly instead of inferring it
// based on the state of the data. This also helps us avoid some coding
// complexity around initializing a full record for the initial load that would
// currently require significantly more refactoring of this component.
// TODO: simplify this if we switch the list-based legend UI to use checkboxes,
// where we *would* want to visually select all items in this case.
type SelectedSeriesState = Record<string, boolean> | 'ALL';

export function TimeSeriesChartPanel(props: TimeSeriesChartProps) {
  const {
    spec: { thresholds, y_axis },
    contentDimensions,
  } = props;
  const chartsTheme = useChartsTheme();
  const muiTheme = useTheme();

  // ECharts theme comes from ChartsThemeProvider, more info: https://echarts.apache.org/en/option.html#color
  // Colors are manually applied since our legend and tooltip are built custom with React.
  const categoricalPalette = chartsTheme.echartsTheme.color;

  const { isFetching, isLoading, queryResults } = useDataQueries();

  const hasData = queryResults.some((result) => result.data && result.data.series.length > 0);

  // TODO: consider refactoring how the layout/spacing/alignment are calculated
  // the next time significant changes are made to the time series panel (e.g.
  // when making improvements to the legend to more closely match designs).
  // This may also want to include moving some of this logic down to the shared,
  // embeddable components.
  const contentPadding = chartsTheme.container.padding.default;
  const adjustedContentDimensions: typeof contentDimensions = contentDimensions
    ? {
        width: contentDimensions.width - contentPadding * 2,
        height: contentDimensions.height - contentPadding * 2,
      }
    : undefined;

  const { thresholds: thresholdsColors } = useChartsTheme();

  // populate default 'position' and other future properties
  const legend =
    props.spec.legend && validateLegendSpec(props.spec.legend)
      ? merge({}, DEFAULT_LEGEND, props.spec.legend)
      : undefined;

  // TODO: add support for y_axis_alt.unit
  const unit = props.spec.y_axis?.unit ?? DEFAULT_UNIT;

  // ensures there are fallbacks for unset properties since most
  // users should not need to customize visual display
  const visual = merge({}, DEFAULT_VISUAL, props.spec.visual);

  // convert Perses dashboard format to be ECharts compatible
  const echartsYAxis = convertPanelYAxis(y_axis);

  const [selectedSeries, setSelectedSeries] = useState<SelectedSeriesState>('ALL');

  const { setTimeRange } = useTimeRange();

  const onLegendItemClick = (e: React.MouseEvent<HTMLElement, MouseEvent>, seriesId: string) => {
    const isModifiedClick = e.metaKey || e.shiftKey;

    setSelectedSeries((current) => {
      return produce(current, (draft) => {
        if (draft === 'ALL') {
          return {
            [seriesId]: true,
          };
        }

        const isSelected = !!draft[seriesId];

        // Clicks with modifier key can select multiple items.
        if (isModifiedClick) {
          if (isSelected) {
            // Modified click on already selected item. Remove that item.
            delete draft[seriesId];
          } else {
            // Modified click on not-selected item. Add it.
            draft[seriesId] = true;
          }
          return draft;
        }

        if (isSelected) {
          // Clicked item was already selected. Unselect it and return to
          // ALL state.
          return 'ALL' as const;
        }

        // Select clicked item.
        return { [seriesId]: true };
      });
    });
  };

  // Populate series data based on query results
  const { graphData } = useDeepMemo(() => {
    // If loading or fetching, we display a loading indicator.
    // We skip the expensive loops below until we are done loading or fetching.
    if (isLoading || isFetching) {
      return {
        graphData: EMPTY_GRAPH_DATA,
      };
    }

    const timeScale = getCommonTimeScaleForQueries(queryResults);
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

    // Index is counted across multiple queries which ensures the categorical color palette does not reset for every query
    let seriesIndex = 0;

    // Total series count across all queries is needed before mapping below to determine which color palette to use
    // This calculation should not impact performance since total number of queries rarely exceeds ~5
    let totalSeries = 0;
    for (let i = 0; i < queryResults.length; i++) {
      totalSeries += queryResults[i]?.data?.series?.length ?? 0;
    }

    // Mapping of each set of query results to be ECharts option compatible
    // TODO: Look into performance optimizations and moving parts of mapping to the lower level chart
    for (const result of queryResults) {
      // Skip queries that are still loading or don't have data
      if (result.isLoading || result.isFetching || result.data === undefined) continue;

      for (let i = 0; i < result.data.series.length; i++) {
        const timeSeries: TimeSeries | undefined = result.data.series[i];
        if (timeSeries === undefined) {
          return { graphData };
        }

        // Format is determined by series_name_format in query spec
        const formattedSeriesName = timeSeries.formattedName ?? timeSeries.name;

        // Color is used for line, tooltip, and legend
        const seriesColor = getSeriesColor({
          // ECharts type for color is not always an array but it is always an array in ChartsThemeProvider
          categoricalPalette: categoricalPalette as string[],
          visual,
          muiPrimaryColor: muiTheme.palette.primary.main,
          seriesName: formattedSeriesName,
          seriesIndex,
          totalSeries,
        });

        // Used for repeating colors in Categorical palette
        seriesIndex++;

        const seriesId = timeSeries.name + seriesIndex;

        const yValues = getYValues(timeSeries, timeScale);
        const lineSeries = getLineSeries(formattedSeriesName, yValues, visual, seriesColor);

        // When we initially load the chart, we want to show all series, but
        // DO NOT want to visualy highlight all the items in the legend.
        const isSelectAll = selectedSeries === 'ALL';
        const isSelected = !isSelectAll && !!selectedSeries[seriesId];
        const showTimeSeries = isSelected || isSelectAll;

        if (showTimeSeries) {
          graphData.timeSeries.push(lineSeries);
        }
        if (legend && graphData.legendItems) {
          graphData.legendItems.push({
            id: seriesId, // Avoids duplicate key console errors when there are duplicate series names
            label: formattedSeriesName,
            isSelected,
            color: seriesColor,
            onClick: (e) => onLegendItemClick(e, seriesId),
          });
        }
      }
    }
    graphData.xAxis = xAxisData;

    if (thresholds && thresholds.steps) {
      // Convert how thresholds are defined in the panel spec to valid ECharts 'line' series.
      // These are styled with predefined colors and a dashed style to look different than series from query results.
      // Regular series are used instead of markLines since thresholds currently show in our React TimeSeriesTooltip.
      const defaultThresholdColor = thresholds.default_color ?? thresholdsColors.defaultColor;
      thresholds.steps.forEach((step: StepOptions, index: number) => {
        const stepPaletteColor = thresholdsColors.palette[index] ?? defaultThresholdColor;
        const thresholdLineColor = step.color ?? stepPaletteColor;
        const stepOption: StepOptions = {
          color: thresholdLineColor,
          value:
            // y_axis is passed here since it corresponds to dashboard JSON instead of the already converted ECharts yAxis
            thresholds.mode === 'Percent'
              ? convertPercentThreshold(step.value, graphData.timeSeries, y_axis?.max, y_axis?.min)
              : step.value,
        };
        const thresholdName = step.name ?? `Threshold ${index + 1} `;
        // TODO: switch back to markLine once alternate tooltip created
        const thresholdData = Array(xAxisData.length).fill(stepOption.value);
        const thresholdLineSeries = getThresholdSeries(thresholdName, thresholdData, stepOption);
        graphData.timeSeries.push(thresholdLineSeries);
      });
    }

    return {
      graphData,
    };
  }, [queryResults, thresholds, selectedSeries, legend, visual, isFetching, isLoading, y_axis?.max, y_axis?.min]);

  if (adjustedContentDimensions === undefined) {
    return null;
  }

  if (isLoading || isFetching) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        width={adjustedContentDimensions.width}
        height={adjustedContentDimensions.height}
      >
        <Skeleton
          variant="text"
          width={adjustedContentDimensions.width - 20}
          height={adjustedContentDimensions.height / 2}
          aria-label="Loading..."
        />
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

  const legendWidth = legend && legend.position === 'Right' ? 200 : adjustedContentDimensions.width;

  // TODO: account for number of time series returned when adjusting legend spacing
  let legendHeight = LEGEND_HEIGHT_SM;
  if (legend && legend.position === 'Right') {
    legendHeight = contentDimensions?.height || adjustedContentDimensions.height;
  } else if (adjustedContentDimensions.height >= PANEL_HEIGHT_LG_BREAKPOINT) {
    legendHeight = LEGEND_HEIGHT_LG;
  }

  // override default spacing, see: https://echarts.apache.org/en/option.html#grid
  const gridLeft = y_axis && y_axis.label ? 30 : 20;
  const gridOverrides: GridComponentOption = {
    left: !echartsYAxis.show ? 0 : gridLeft,
    right: legend && legend.position === 'Right' ? legendWidth : 20,
    bottom: legend && legend.position === 'Bottom' ? legendHeight : 0,
  };

  const handleDataZoom = (event: ZoomEventData) => {
    // TODO: add ECharts transition animation on zoom
    setTimeRange({ start: new Date(event.start), end: new Date(event.end) });
  };

  return (
    <Box sx={{ padding: `${contentPadding}px`, position: 'relative' }}>
      {y_axis && y_axis.show && y_axis.label && (
        <YAxisLabel name={y_axis.label} height={adjustedContentDimensions.height} />
      )}
      <LineChart
        height={adjustedContentDimensions.height}
        data={graphData}
        yAxis={echartsYAxis}
        unit={unit}
        grid={gridOverrides}
        tooltipConfig={{ wrapLabels: true }}
        onDataZoom={handleDataZoom}
      />
      {legend && graphData.legendItems && (
        <Legend width={legendWidth} height={legendHeight} options={legend} data={graphData.legendItems} />
      )}
    </Box>
  );
}
