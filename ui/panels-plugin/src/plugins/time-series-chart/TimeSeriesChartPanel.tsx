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

import { useMemo, useRef, useState } from 'react';
import { Box, Skeleton, useTheme } from '@mui/material';
import type { GridComponentOption } from 'echarts';
import merge from 'lodash/merge';
import {
  useDeepMemo,
  getTimeSeriesValues,
  DEFAULT_LEGEND,
  getCalculations,
  formatValue,
  StepOptions,
  TimeSeries,
  TimeSeriesValueTuple,
} from '@perses-dev/core';
import {
  LEGEND_VALUE_CONFIG,
  PanelProps,
  useDataQueries,
  useTimeRange,
  validateLegendSpec,
  legendValues,
} from '@perses-dev/plugin-system';
import {
  ChartInstance,
  YAxisLabel,
  ZoomEventData,
  useChartsTheme,
  SelectedLegendItemState,
  ContentWithLegend,
  TableColumnConfig,
  LegendItem,
  LegendProps,
  useId,
  TimeChart,
  TimeChartSeriesMapping,
  TooltipConfig,
  DEFAULT_TOOLTIP_CONFIG,
} from '@perses-dev/components';
import {
  TimeSeriesChartOptions,
  DEFAULT_UNIT,
  DEFAULT_VISUAL,
  THRESHOLD_PLOT_INTERVAL,
} from './time-series-chart-model';
import {
  getTimeSeries,
  getCommonTimeScaleForQueries,
  convertPanelYAxis,
  getThresholdSeries,
  convertPercentThreshold,
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

export function TimeSeriesChartPanel(props: TimeSeriesChartProps) {
  const {
    spec: { thresholds, y_axis, tooltip },
    contentDimensions,
  } = props;
  const chartsTheme = useChartsTheme();
  const muiTheme = useTheme();
  const chartId = useId('time-series-panel');

  const chartRef = useRef<ChartInstance>(null);

  // ECharts theme comes from ChartsProvider, more info: https://echarts.apache.org/en/option.html#color
  // Colors are manually applied since our legend and tooltip are built custom with React.
  const categoricalPalette = chartsTheme.echartsTheme.color;

  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');

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

  const [selectedLegendItems, setSelectedLegendItems] = useState<SelectedLegendItemState>('ALL');
  const [legendSorting, setLegendSorting] = useState<NonNullable<LegendProps['tableProps']>['sorting']>();

  const { setTimeRange } = useTimeRange();

  // Populate series data based on query results
  const { timeScale, timeChartData, timeSeriesMapping, legendItems } = useDeepMemo(() => {
    // If loading or fetching, we display a loading indicator.
    // We skip the expensive loops below until we are done loading or fetching.
    if (isLoading || isFetching) {
      return {
        timeChartData: [],
        timeSeriesMapping: [],
      };
    }

    const timeScale = getCommonTimeScaleForQueries(queryResults);
    if (timeScale === undefined) {
      return {
        timeChartData: [],
        timeSeriesMapping: [],
      };
    }

    const legendItems: LegendItem[] = [];

    // Utilizes ECharts dataset so raw data is separate from series option style properties
    // https://apache.github.io/echarts-handbook/en/concepts/dataset/
    const timeChartData: TimeSeries[] = [];
    const timeSeriesMapping: TimeChartSeriesMapping = [];

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
          return { timeChartData: [], timeSeriesMapping: [], legendItems: [] };
        }

        // Format is determined by series_name_format in query spec
        const formattedSeriesName = timeSeries.formattedName ?? timeSeries.name;

        // Color is used for line, tooltip, and legend
        const seriesColor = getSeriesColor({
          // ECharts type for color is not always an array but it is always an array in ChartsProvider
          categoricalPalette: categoricalPalette as string[],
          visual,
          muiPrimaryColor: muiTheme.palette.primary.main,
          seriesName: formattedSeriesName,
          seriesIndex,
          totalSeries,
        });

        // We add a unique id for the chart to disambiguate items across charts
        // when there are multiple on the page.
        const seriesId = chartId + timeSeries.name + seriesIndex;

        const legendCalculations = legend?.values ? getCalculations(timeSeries.values, legend.values) : undefined;

        // When we initially load the chart, we want to show all series, but
        // DO NOT want to visualy highlight all the items in the legend.
        const isSelectAll = selectedLegendItems === 'ALL';
        const isSelected = !isSelectAll && !!selectedLegendItems[seriesId];
        const showTimeSeries = isSelected || isSelectAll;

        if (showTimeSeries) {
          // Use timeChartData.length to ensure the data that is passed into the tooltip accounts for
          // which legend items are selected. This must happen before timeChartData.push to avoid an
          // off-by-one error, seriesIndex cannot be used since it's needed to cycle through palette
          const datasetIndex = timeChartData.length;

          // Each series is stored as a separate dataset source.
          // https://apache.github.io/echarts-handbook/en/concepts/dataset/#how-to-reference-several-datasets
          timeSeriesMapping.push(
            getTimeSeries(seriesId, datasetIndex, formattedSeriesName, visual, timeScale, seriesColor)
          );

          timeChartData.push({
            name: formattedSeriesName,
            values: getTimeSeriesValues(timeSeries, timeScale),
          });
        }

        if (legend && legendItems) {
          legendItems.push({
            id: seriesId, // Avoids duplicate key console errors when there are duplicate series names
            label: formattedSeriesName,
            color: seriesColor,
            data: legendCalculations,
          });
        }

        // Used for repeating colors in Categorical palette
        seriesIndex++;
      }
    }

    if (thresholds && thresholds.steps) {
      // Convert how thresholds are defined in the panel spec to valid ECharts 'line' series.
      // These are styled with predefined colors and a dashed style to look different than series from query results.
      // Regular series are used instead of markLines since thresholds currently show in our React TimeSeriesTooltip.
      const thresholdsColors = chartsTheme.thresholds;
      const defaultThresholdColor = thresholds.default_color ?? thresholdsColors.defaultColor;
      thresholds.steps.forEach((step: StepOptions, index: number) => {
        const stepPaletteColor = thresholdsColors.palette[index] ?? defaultThresholdColor;
        const thresholdLineColor = step.color ?? stepPaletteColor;
        const stepOption: StepOptions = {
          color: thresholdLineColor,
          value:
            // y_axis is passed here since it corresponds to dashboard JSON instead of the already converted ECharts yAxis
            thresholds.mode === 'Percent'
              ? convertPercentThreshold(step.value, timeChartData, y_axis?.max, y_axis?.min)
              : step.value,
        };
        const thresholdName = step.name ?? `Threshold ${index + 1}`;

        // Generates array of [time, step.value] where time ranges from timescale.startMs to timescale.endMs with an interval of 15s
        const thresholdTimeValueTuple: TimeSeriesValueTuple[] = [];
        let currentTimestamp = timeScale.startMs;
        while (currentTimestamp <= timeScale.endMs) {
          thresholdTimeValueTuple.push([currentTimestamp, stepOption.value]);
          // Used to plot fake thresholds datapoints so correct nearby threshold series shows in tooltip without flicker
          currentTimestamp += 1000 * THRESHOLD_PLOT_INTERVAL;
        }

        timeChartData.push({
          name: thresholdName,
          values: thresholdTimeValueTuple,
        });
        timeSeriesMapping.push(getThresholdSeries(thresholdName, stepOption, seriesIndex));
        seriesIndex++;
      });
    }

    return {
      timeScale,
      timeChartData,
      timeSeriesMapping,
      legendItems,
    };
  }, [queryResults, thresholds, selectedLegendItems, legend, visual, isFetching, isLoading, y_axis?.max, y_axis?.min]);

  // Translate the legend values into columns for the table legend.
  const legendColumns = useMemo(() => {
    if (!legend?.values) {
      return [];
    }

    // Iterating the predefined list of possible values to retain a specific
    // intended order of values.
    return legendValues.reduce((columns, legendValue) => {
      const legendConfig = LEGEND_VALUE_CONFIG[legendValue];

      if (legendConfig && legend?.values?.includes(legendValue)) {
        columns.push({
          accessorKey: `data.${legendValue}`,
          header: legendConfig.label,
          headerDescription: legendConfig.description,
          // Intentionally hardcoding a column width to start based on discussions
          // with design around keeping this simple to start. This may need
          // revisiting in the future to handle edge cases with very large values.
          width: 72,
          align: 'right',
          cell: ({ getValue }) => {
            const cellValue = getValue();
            return typeof cellValue === 'number' && unit ? formatValue(cellValue, unit) : cellValue;
          },
          cellDescription: true,
          enableSorting: true,
        });
      }

      return columns;
    }, [] as Array<TableColumnConfig<LegendItem>>);
  }, [legend?.values, unit]);

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

  // override default spacing, see: https://echarts.apache.org/en/option.html#grid
  const gridLeft = y_axis && y_axis.label ? 30 : 20;
  const gridOverrides: GridComponentOption = {
    left: !echartsYAxis.show ? 0 : gridLeft,
    right: 20,
    bottom: 0,
  };

  const handleDataZoom = (event: ZoomEventData) => {
    // TODO: add ECharts transition animation on zoom
    setTimeRange({ start: new Date(event.start), end: new Date(event.end) });
  };

  // Used to opt in to ECharts trigger item which show subgroup data accurately
  const isStackedBar = visual.display === 'bar' && visual.stack === 'all';

  // Turn on tooltip pinning by default but opt out for stacked bar or if explicitly set in tooltip panel spec
  let enablePinning = true;
  if (isStackedBar) {
    enablePinning = false;
  } else if (tooltip?.enable_pinning !== undefined) {
    enablePinning = tooltip.enable_pinning;
  }
  const tooltipConfig: TooltipConfig = {
    ...DEFAULT_TOOLTIP_CONFIG,
    enablePinning,
  };

  return (
    <Box sx={{ padding: `${contentPadding}px` }}>
      <ContentWithLegend
        width={adjustedContentDimensions.width}
        height={adjustedContentDimensions.height}
        // Making this small enough that the medium size doesn't get
        // responsive-handling-ed away when in the panel options editor.
        minChildrenHeight={50}
        legendSize={legend?.size}
        legendProps={
          legend && {
            options: legend,
            data: legendItems || [],
            selectedItems: selectedLegendItems,
            onSelectedItemsChange: setSelectedLegendItems,
            tableProps: {
              columns: legendColumns,
              sorting: legendSorting,
              onSortingChange: setLegendSorting,
            },
            onItemMouseOver: (e, { id }) => {
              chartRef.current?.highlightSeries({ name: id });
            },
            onItemMouseOut: () => {
              chartRef.current?.clearHighlightedSeries();
            },
          }
        }
      >
        {({ height, width }) => {
          return (
            <Box sx={{ height, width }}>
              {y_axis && y_axis.show && y_axis.label && <YAxisLabel name={y_axis.label} height={height} />}
              <TimeChart
                ref={chartRef}
                height={height}
                data={timeChartData}
                seriesMapping={timeSeriesMapping}
                timeScale={timeScale}
                yAxis={echartsYAxis}
                unit={unit}
                grid={gridOverrides}
                isStackedBar={isStackedBar}
                tooltipConfig={tooltipConfig}
                syncGroup="default-panel-group" // TODO: make configurable from dashboard settings and per panel-group overrides
                onDataZoom={handleDataZoom}
                //  Show an empty chart when there is no data because the user unselected all items in
                // the legend. Otherwise, show a "no data" message.
                noDataVariant={!timeChartData.length && legendItems && legendItems.length > 0 ? 'chart' : 'message'}
              />
            </Box>
          );
        }}
      </ContentWithLegend>
    </Box>
  );
}
