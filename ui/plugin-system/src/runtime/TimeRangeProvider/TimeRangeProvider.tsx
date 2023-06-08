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

import React, { useMemo, useState, useCallback, createContext, useContext } from 'react';
import {
  AbsoluteTimeRange,
  DurationString,
  isRelativeTimeRange,
  TimeRangeValue,
  toAbsoluteTimeRange,
} from '@perses-dev/core';
import { useSetRefreshIntervalParams, useSetTimeRangeParams } from './query-params';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  initialRefreshInterval?: DurationString;
  enabledURLParams?: boolean;
  children?: React.ReactNode;
}

export interface TimeRange {
  timeRange: TimeRangeValue;
  absoluteTimeRange: AbsoluteTimeRange; // resolved absolute time for plugins to use
  setTimeRange: (value: TimeRangeValue) => void;
  refresh: () => void;
  refreshKey: string;
  refreshInterval?: DurationString;
  refreshIntervalInMs: number;
  setRefreshInterval: (value: DurationString) => void;
}

export const TimeRangeContext = createContext<TimeRange | undefined>(undefined);

export function useTimeRangeContext() {
  const ctx = useContext(TimeRangeContext);
  if (ctx === undefined) {
    throw new Error('No TimeRangeContext found. Did you forget a Provider?');
  }
  return ctx;
}

/**
 * Get and set the current resolved time range at runtime.
 */
export function useTimeRange(): TimeRange {
  return useTimeRangeContext();
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { initialTimeRange, initialRefreshInterval, enabledURLParams, children } = props;

  const { timeRange, setTimeRange } = useSetTimeRangeParams(initialTimeRange, enabledURLParams);
  const { refreshInterval, setRefreshInterval, refreshIntervalInMs } = useSetRefreshIntervalParams(
    initialRefreshInterval,
    enabledURLParams
  );

  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(refreshKey + 1);
  }, [refreshKey]);

  const ctx = useMemo(() => {
    const absoluteTimeRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    return {
      timeRange,
      setTimeRange,
      absoluteTimeRange,
      refresh,
      refreshKey: `${absoluteTimeRange.start}:${absoluteTimeRange.end}:${refreshInterval}:${refreshKey}`,
      refreshInterval,
      refreshIntervalInMs,
      setRefreshInterval,
    };
  }, [timeRange, setTimeRange, refresh, refreshKey, refreshInterval, refreshIntervalInMs, setRefreshInterval]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
