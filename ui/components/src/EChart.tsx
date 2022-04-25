import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
// import React, { useCallback, useState, useLayoutEffect } from 'react';
import debounce from 'lodash/debounce';
import { ECharts, EChartsCoreOption, init } from 'echarts/core';
import { Box, SxProps, Theme } from '@mui/material';
// import { useDeepMemo } from '../utils';

// https://echarts.apache.org/en/api.html#events
export interface MouseEventsParameters<T> {
  componentType: string;
  seriesType: string;
  seriesIndex: number;
  seriesName: string;
  name: string;
  dataIndex: number;
  data: Record<string, unknown> & T;
  dataType: string;
  value: number | number[];
  color: string;
  info: Record<string, unknown>;
}

type OnEventFunction<T> = (
  params: MouseEventsParameters<T>,
  // This is potentially undefined for testing purposes
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
}

export const EChart = React.memo(function ECharts<T>({
  sx,
  _instance,
  // TODO (sjcobb): add back, rename onChartReady
  // https://github.com/guoliim/react-echarts/blob/master/src/index.tsx#L152
  // onChartInitialized,
  option,
  onEvents,
}: EChartsProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartElement = useRef<ECharts | null>(null);
  const initChartDom = useCallback(() => {
    if (chartElement.current !== null) {
      chartElement.current.dispose();
    }
    if (containerRef.current) {
      chartElement.current = init(containerRef.current);
      if (_instance !== undefined) {
        _instance.current = chartElement.current;
      }
    }
  }, [_instance]);

  useEffect(() => {
    // TODO (sjcobb): cleanup
    if (chartElement === undefined) return;
    if (chartElement.current === undefined) return;
    const chart = chartElement.current;
    if (chart === null || onEvents === undefined) return;
    bindEvents(chart, onEvents);
  }, [chartElement, onEvents]);

  // Sync options with chart instance
  useLayoutEffect(() => {
    initChartDom();
    if (chartElement.current === null) return;
    // TODO (sjcobb): add isEqual check to only call setOption when option changes
    chartElement.current.setOption(option, true);
  }, [initChartDom, chartElement, option]);

  // Resize chart, cleanup on unmount
  useLayoutEffect(() => {
    const updateSize = debounce(() => {
      if (chartElement.current === null) return;
      chartElement.current.resize();
    }, 200);
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => {
      // TODO (sjcobb): is prevValue check or setOption -> lazyUpdate needed?
      // https://github.com/guoliim/react-echarts/blob/master/src/index.tsx#L129
      window.removeEventListener('resize', updateSize);
      if (chartElement.current !== null) {
        chartElement.current.dispose();
        chartElement.current = null;
        // prevValue.current = undefined
      }
    };
  }, [chartElement]);

  return <Box ref={containerRef} sx={sx}></Box>;
});

// Validate event config and bind custom events
function bindEvents<T>(instance: ECharts, events?: OnEventsType<T>) {
  if (events === undefined) return;
  function bindEvent(eventName: EventName, OnEventFunction: unknown) {
    if (typeof OnEventFunction === 'function') {
      if (isMouseEvent(eventName)) {
        instance.on(eventName, (params) => OnEventFunction(params, instance));
      } else if (isBatchEvent(eventName)) {
        instance.on(eventName, (params) => OnEventFunction(params));
      } else {
        instance.on(eventName, () => OnEventFunction(null, instance));
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
