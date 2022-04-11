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

import React, { useState, useLayoutEffect } from 'react';
import debounce from 'lodash/debounce';
import { ECharts, EChartsCoreOption, init } from 'echarts/core';
import { Box, SxProps, Theme } from '@mui/material';

export interface MouseEventsParameters<T> {
  // type of the component to which the clicked glyph belongs
  // i.e., 'series', 'markLine', 'markPoint', 'timeLine'
  componentType: string;
  // series type (make sense when componentType is 'series')
  // i.e., 'line', 'bar', 'pie'
  seriesType: string;
  // series index in incoming option.series (make sense when componentType is 'series')
  seriesIndex: number;
  // series name (make sense when componentType is 'series')
  seriesName: string;
  // data name, category name
  name: string;
  // data index in incoming data array
  dataIndex: number;
  // incoming raw data item
  data: Record<string, unknown> & T;
  // Some series, such as sankey or graph, maintains more than
  // one types of data (nodeData and edgeData), which can be
  // distinguished from each other by dataType with its value
  // 'node' and 'edge'.
  // On the other hand, most series has only one type of data,
  // where dataType is not needed.
  dataType: string;
  // incoming data value
  value: number | number[];
  // color of component (make sense when componentType is 'series')
  color: string;
  // User info (only available in graphic component
  // and custom series, if element option has info
  // property, e.g., {type: 'circle', info: {some: 123}})
  info: Record<string, unknown>;
}

type OnEventFunction<T> = (
  params: MouseEventsParameters<T>,
  // This is potentially undefined for testing purposes
  // probably a better way to type this that isolates testing scenarios
  instance?: ECharts
) => void;

const mouseEvents = [
  'click',
  'dblclick',
  'mousedown',
  'mousemove',
  'mouseup',
  'mouseover',
  'mouseout',
  'globalout',
  'contextmenu',
] as const;

export type MouseEventName = typeof mouseEvents[number];

// batch event types
export interface DataZoomPayloadBatchItem {
  dataZoomId: string;
  // start and end not returned unless dataZoom is based on percentProp,
  // which is for cases when a dataZoom component controls multiple axes
  start?: number;
  end?: number;
  // startValue and endValue return data index for 'category' axes,
  // for axis types 'value' and 'time', actual values are returned
  startValue?: number;
  endValue?: number;
}

export interface HighlightPayloadBatchItem {
  dataIndex: number;
  dataIndexInside: number;
  seriesIndex: number;
  // highlight action can effect multiple connected charts
  escapeConnect?: boolean;
  // whether blur state was triggered
  notBlur?: boolean;
}

export interface BatchEventsParameters {
  type: BatchEventName;
  batch: DataZoomPayloadBatchItem[] & HighlightPayloadBatchItem[];
}

type OnBatchEventFunction = (params: BatchEventsParameters) => void;

const batchEvents = ['datazoom', 'downplay', 'highlight'] as const;

export type BatchEventName = typeof batchEvents[number];

// TODO: add remaining supported events from https://echarts.apache.org/en/api.html#events
type ChartEventName = 'finished';

type EventName = MouseEventName | ChartEventName | BatchEventName;

export type OnEventsType<T> = {
  [mouseEventName in MouseEventName]?: OnEventFunction<T>;
} & {
  [batchEventName in BatchEventName]?: OnBatchEventFunction;
} & {
  [eventName in ChartEventName]?: () => void;
};

export interface EChartsProps<T> {
  option: EChartsCoreOption;
  sx?: SxProps<Theme>;
  onChartInitialized?: (instance: ECharts) => void;
  onEvents?: OnEventsType<T>;
  _instance?: React.MutableRefObject<ECharts | undefined>;
  parentContainer?: HTMLDivElement | null;
}

export function ECharts<T>({ sx, _instance, onChartInitialized, option, onEvents, parentContainer }: EChartsProps<T>) {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [echart, setChart] = useState<ECharts | undefined>(undefined);
  // Create a chart instance in the container
  useLayoutEffect(() => {
    if (containerRef === null) return;

    const chart = init(containerRef);
    setChart(chart);
    if (_instance !== undefined) {
      _instance.current = chart;
    }
    bindEvents(chart, onEvents);

    onChartInitialized?.(chart);

    return () => {
      chart.dispose();
    };
  }, [containerRef, _instance, onChartInitialized, onEvents]);

  // Sync options with chart instance
  useLayoutEffect(() => {
    if (echart === undefined) return;
    echart.setOption(option);
  }, [echart, option]);

  useLayoutEffect(() => {
    const updateSize = debounce(() => {
      echart?.resize();
    }, 200);
    let observer: ResizeObserver | undefined;
    if (parentContainer != null) {
      observer = new ResizeObserver(() => {
        updateSize();
      });
      observer.observe(parentContainer);
    } else {
      window.addEventListener('resize', updateSize);
    }
    updateSize();
    return () => {
      if (parentContainer != null) {
        observer?.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
    };
  }, [echart, parentContainer]);

  return <Box ref={setContainerRef} sx={sx}></Box>;
}

// Validate event config and bind custom events
function bindEvents<T>(instance: ECharts, events?: OnEventsType<T>) {
  if (events === undefined) return;
  function bindEvent(eventName: EventName, onEventFunction: unknown) {
    if (typeof onEventFunction === 'function') {
      if (isMouseEvent(eventName)) {
        instance.on(eventName, (param) => onEventFunction(param, instance));
      } else if (isBatchEvent(eventName)) {
        instance.on(eventName, (param) => onEventFunction(param));
      } else {
        instance.on(eventName, () => onEventFunction(null, instance));
      }
    }
  }

  for (const eventName in events) {
    if (Object.prototype.hasOwnProperty.call(events, eventName)) {
      const customEvent = events[eventName as EventName] ?? null;
      if (customEvent) {
        bindEvent(eventName as EventName, customEvent);
      }
    }
  }
}

function isMouseEvent(eventName: EventName): eventName is MouseEventName {
  return (mouseEvents as readonly string[]).includes(eventName);
}

function isBatchEvent(eventName: EventName): eventName is BatchEventName {
  return (batchEvents as readonly string[]).includes(eventName);
}
