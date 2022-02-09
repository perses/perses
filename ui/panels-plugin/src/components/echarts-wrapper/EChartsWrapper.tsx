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

import { useState, useLayoutEffect } from 'react';
import debounce from 'lodash/debounce';
import { ECharts, EChartsCoreOption, init } from 'echarts/core';
import { Box, SxProps, Theme } from '@mui/material';

export type onEventFunction = () => void;

export type onEventsType = Record<string, onEventFunction>;

export interface EChartsWrapper {
  sx: SxProps<Theme>;
  option: EChartsCoreOption;
  theme?: string;
  onChartReady?: (instance: ECharts) => void;
  onEvents?: onEventsType;
}

export function EChartsWrapper(props: EChartsWrapper) {
  const { sx, option, theme, onChartReady, onEvents } = props;

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ECharts | undefined>(undefined);

  // Create a chart instance in the container
  useLayoutEffect(() => {
    if (containerRef === null) return;

    // TODO (sjcobb): support passing theme, optional svg renderer
    const chart = init(containerRef, theme, { renderer: 'canvas' });

    setChart(chart);

    return () => {
      chart.dispose();
    };
  }, [containerRef, theme]);

  // Sync options with chart instance
  useLayoutEffect(() => {
    if (chart === undefined) return;

    if (option.series === undefined) {
      // TODO (sjcob): customize loading state, use MUI Skeleton
      chart.showLoading();
    } else {
      chart.hideLoading();
    }

    chart.setOption(option);

    const echartsInstance = chart;
    bindEvents(echartsInstance, onEvents ?? {});

    if (typeof onChartReady === 'function') onChartReady(echartsInstance);
  }, [chart, option, onEvents, onChartReady]);

  useLayoutEffect(() => {
    const updateSize = debounce(() => {
      chart?.resize();
    }, 200);
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, [chart]);

  return <Box ref={setContainerRef} sx={sx}></Box>;
}

// Validate event config and bind custom events
function bindEvents(instance: ECharts, events: onEventsType) {
  function bindEvent(eventName: string, onEventFunction: unknown) {
    if (typeof eventName === 'string' && typeof onEventFunction === 'function') {
      instance.on(eventName, (param) => {
        onEventFunction(param, instance);
      });
    }
  }

  for (const eventName in events) {
    if (Object.prototype.hasOwnProperty.call(events, eventName)) {
      const customEvent = events[eventName] ?? null;
      if (customEvent) {
        bindEvent(eventName, customEvent);
      }
    }
  }
  // TODO (sjcobb): unbind events
}
