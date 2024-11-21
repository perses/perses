//Copyright 2024 The Perses Authors
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

import {
  PieChart,
  PieChartData,
  LoadingOverlay,
  useChartsTheme,
  ContentWithLegend,
  SelectedLegendItemState,
  LegendProps,
  ChartInstance,
  useId,
  LegendItem,
} from '@perses-dev/components';
import { Box, useTheme } from '@mui/material';
import { useMemo, useState, useRef } from 'react';
import { CalculationType, CalculationsMap, DEFAULT_LEGEND } from '@perses-dev/core';
import { validateLegendSpec, useDataQueries, PanelProps } from '@perses-dev/plugin-system';
import merge from 'lodash/merge';
import { getSeriesColor } from '../time-series-chart/utils/palette-gen';
import { DEFAULT_VISUAL, QuerySettingsOptions } from '../time-series-chart/time-series-chart-model';
import { PieChartOptions } from './pie-chart-model';
import { calculatePercentages, sortSeriesData } from './utils';

export type PieChartPanelProps = PanelProps<PieChartOptions>;

export function PieChartPanel(props: PieChartPanelProps) {
  const {
    spec: { calculation, sort, mode, querySettings: querySettingsList },
    contentDimensions,
  } = props;
  const chartsTheme = useChartsTheme();
  const muiTheme = useTheme();
  const PADDING = chartsTheme.container.padding.default;
  const { queryResults, isLoading, isFetching } = useDataQueries('TimeSeriesQuery'); // gets data queries from a context provider, see DataQueriesProvider
  const chartId = useId('time-series-panel');
  const categoricalPalette = chartsTheme.echartsTheme.color;

  const visual = useMemo(() => {
    return merge({}, DEFAULT_VISUAL, props.spec.visual);
  }, [props.spec.visual]);

  const { pieChartData, legendItems } = useMemo(() => {
    const calculate = CalculationsMap[calculation as CalculationType];
    const pieChartData: PieChartData[] = [];
    const legendItems: LegendItem[] = [];

    for (let queryIndex = 0; queryIndex < queryResults.length; queryIndex++) {
      const result = queryResults[queryIndex];
      // Skip queries that are still loading or don't have data
      if (!result || result.isLoading || result.isFetching || result.data === undefined) continue;

      let seriesIndex = 0;
      for (const seriesData of result.data.series) {
        // Retrieve querySettings for this query, if exists.
        // queries & querySettings indices do not necessarily match, so we have to check the tail value of the $ref attribute
        let querySettings: QuerySettingsOptions | undefined;
        for (const item of querySettingsList ?? []) {
          if (item.queryIndex === queryIndex) {
            querySettings = item;
            // We don't break the loop here just in case there are multiple querySettings defined for the
            // same queryIndex, because in that case we want the last one to take precedence.
          }
        }
        const seriesColor = getSeriesColor({
          categoricalPalette: categoricalPalette as string[],
          visual,
          muiPrimaryColor: muiTheme.palette.primary.main,
          seriesName: seriesData.name,
          seriesIndex,
          querySettings: querySettings,
          queryHasMultipleResults: (queryResults[queryIndex]?.data?.series?.length ?? 0) > 1,
        });
        const series = {
          value: calculate(seriesData.values) ?? null,
          name: seriesData.formattedName ?? '',
          itemStyle: {
            color: seriesColor,
          },
        };
        pieChartData.push(series);

        const seriesId = chartId + seriesData.name + seriesIndex;
        legendItems.push({
          id: seriesId,
          label: series.name,
          color: seriesColor,
        });
        seriesIndex++;
      }
    }

    const sortedPieChartData = sortSeriesData(pieChartData, sort);
    if (mode === 'percentage') {
      return {
        pieChartData: calculatePercentages(sortedPieChartData),
        legendItems,
      };
    }
    return {
      pieChartData: sortedPieChartData,
      legendItems,
    };
  }, [
    calculation,
    sort,
    mode,
    queryResults,
    categoricalPalette,
    visual,
    muiTheme.palette.primary.main,
    chartId,
    querySettingsList,
  ]);

  const contentPadding = chartsTheme.container.padding.default;
  const adjustedContentDimensions: typeof contentDimensions = contentDimensions
    ? {
        width: contentDimensions.width - contentPadding * 2,
        height: contentDimensions.height - contentPadding * 2,
      }
    : undefined;

  const legend = useMemo(() => {
    return props.spec.legend && validateLegendSpec(props.spec.legend)
      ? merge({}, DEFAULT_LEGEND, props.spec.legend)
      : undefined;
  }, [props.spec.legend]);

  const [selectedLegendItems, setSelectedLegendItems] = useState<SelectedLegendItemState>('ALL');

  const [legendSorting, setLegendSorting] = useState<NonNullable<LegendProps['tableProps']>['sorting']>();

  const chartRef = useRef<ChartInstance>(null);

  // ensures there are fallbacks for unset properties since most
  // users should not need to customize visual display

  if (queryResults[0]?.error) throw queryResults[0]?.error;
  if (contentDimensions === undefined) return null;

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  return (
    <Box sx={{ padding: `${PADDING}px` }}>
      <ContentWithLegend
        width={adjustedContentDimensions?.width ?? 400}
        height={adjustedContentDimensions?.height ?? 1000}
        // Making this small enough that the medium size doesn't get
        // responsive-handling-ed away when in the panel options editor.
        minChildrenHeight={50}
        legendSize={legend?.size}
        legendProps={
          legend && {
            options: legend,
            data: legendItems,
            selectedItems: selectedLegendItems,
            onSelectedItemsChange: setSelectedLegendItems,
            tableProps: {
              columns: [],
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
              <PieChart
                data={pieChartData}
                width={contentDimensions.width - PADDING * 2}
                height={contentDimensions.height - PADDING * 2}
              />
            </Box>
          );
        }}
      </ContentWithLegend>
    </Box>
  );
}
