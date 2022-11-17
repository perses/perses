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

import { MouseEvent, useMemo, useRef, useState } from 'react';
import { merge } from 'lodash-es';
import { useDeepMemo } from '@perses-dev/core';
import { Box } from '@mui/material';
import type {
  EChartsCoreOption,
  GridComponentOption,
  LineSeriesOption,
  LegendComponentOption,
  VisualMapComponentOption,
  YAXisComponentOption,
} from 'echarts';
import { ECharts as EChartsInstance, use } from 'echarts/core';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import {
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChart, OnEventsType } from '../EChart';
import { PROGRESSIVE_MODE_SERIES_LIMIT, EChartsDataFormat } from '../model/graph';
import { formatValue, UnitOptions } from '../model/units';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { Tooltip } from '../Tooltip/Tooltip';
import { enableDataZoom, restoreChart, getDateRange, getFormattedDate, ZoomEventData } from './utils';

use([
  EChartsLineChart,
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

interface LineChartProps {
  height: number;
  data: EChartsDataFormat;
  yAxis?: YAXisComponentOption;
  unit?: UnitOptions;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  visualMap?: VisualMapComponentOption[];
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
}

export function LineChart({
  height,
  data,
  yAxis,
  unit,
  grid,
  legend,
  visualMap,
  onDataZoom,
  onDoubleClick,
}: LineChartProps) {
  const chartsTheme = useChartsTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [pinTooltip, setPinTooltip] = useState<boolean>(false);

  const handleEvents: OnEventsType<LineSeriesOption['data'] | unknown> = useMemo(() => {
    return {
      datazoom: (params) => {
        if (onDataZoom === undefined) {
          setTimeout(() => {
            // workaround so unpin happens after click event
            setPinTooltip(false);
          }, 10);
        }
        if (onDataZoom === undefined || params.batch[0] === undefined) return;
        const startIndex = params.batch[0].startValue ?? 0;
        const endIndex = params.batch[0].endValue ?? data.xAxis.length - 1;
        const xAxisStartValue = data.xAxis[startIndex];
        const xAxisEndValue = data.xAxis[endIndex];

        if (xAxisStartValue !== undefined && xAxisEndValue !== undefined) {
          const zoomEvent: ZoomEventData = {
            start: xAxisStartValue,
            end: xAxisEndValue,
            startIndex,
            endIndex,
          };
          onDataZoom(zoomEvent);
        }
      },
      // TODO: use legendselectchanged event to fix tooltip when legend selected
    };
  }, [data, onDataZoom, setPinTooltip]);

  if (chartRef.current !== undefined) {
    enableDataZoom(chartRef.current);
  }

  const handleOnClick = () => setPinTooltip((current) => !current);

  const handleOnDoubleClick = (e: MouseEvent) => {
    setPinTooltip(false);
    // either dispatch ECharts restore action to return to orig state or allow consumer to define behavior
    if (onDoubleClick === undefined) {
      if (chartRef.current !== undefined) {
        restoreChart(chartRef.current);
      }
    } else {
      onDoubleClick(e);
    }
  };

  const handleOnMouseDown = (e: MouseEvent) => {
    // hide tooltip when user drags to zoom, but allow clicking inside tooltip to copy labels
    if (e.target instanceof HTMLCanvasElement) {
      setShowTooltip(false);
    }
  };

  const handleOnMouseUp = () => {
    setShowTooltip(true);
  };

  const handleOnMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleOnMouseLeave = () => {
    setShowTooltip(false);
    setPinTooltip(false);
  };

  const option: EChartsCoreOption = useDeepMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null || data.timeSeries.length === 0) return chartsTheme.noDataOption;

    const showPointsOnHover = data.timeSeries.length < PROGRESSIVE_MODE_SERIES_LIMIT;

    const rangeMs = data.rangeMs ?? getDateRange(data.xAxis);

    const yAxisDefault = {
      type: 'value',
      boundaryGap: [0, '10%'],
      axisLabel: {
        formatter: (value: number) => {
          return formatValue(value, unit);
        },
      },
    };
    const yAxisPrimary = merge(yAxisDefault, yAxis);

    const option: EChartsCoreOption = {
      series: data.timeSeries,
      xAxis: {
        type: 'category',
        data: data.xAxis,
        max: data.xAxisMax,
        axisLabel: {
          formatter: (value: number) => {
            return getFormattedDate(value, rangeMs);
          },
        },
      },
      yAxis: [yAxisPrimary], // TODO: support alternate yAxis that shows on right side
      animation: false,
      tooltip: {
        show: showPointsOnHover,
        trigger: 'axis',
        showContent: false,
        axisPointer: {
          type: 'none',
        },
      },
      toolbox: {
        feature: {
          dataZoom: {
            icon: null, // https://stackoverflow.com/a/67684076/17575201
            yAxisIndex: 'none',
          },
        },
      },
      grid,
      legend,
      visualMap,
    };

    return option;
  }, [data, yAxis, grid, legend, visualMap]);

  return (
    <Box
      sx={{
        height,
      }}
      onClick={handleOnClick}
      onDoubleClick={handleOnDoubleClick}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
      onMouseLeave={handleOnMouseLeave}
      onMouseEnter={handleOnMouseEnter}
    >
      {showTooltip === true && (
        <Tooltip chartRef={chartRef} chartData={data} wrapLabels={true} pinTooltip={pinTooltip} unit={unit}></Tooltip>
      )}

      <EChart
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
        onEvents={handleEvents}
        _instance={chartRef}
      />
    </Box>
  );
}
