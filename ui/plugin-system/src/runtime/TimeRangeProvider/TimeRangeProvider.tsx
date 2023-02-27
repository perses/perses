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
import { AbsoluteTimeRange, isRelativeTimeRange, TimeRangeValue, toAbsoluteTimeRange } from '@perses-dev/core';
// import { useSetTimeRangeParams } from './query-params';

export interface TimeRangeProviderProps {
  // initialTimeRange: TimeRangeValue;
  timeRange: TimeRangeValue;
  children?: React.ReactNode;
  onChange: (value: TimeRangeValue) => void;
}

export interface TimeRange {
  timeRange: TimeRangeValue;
  absoluteTimeRange: AbsoluteTimeRange; // resolved absolute time for plugins to use
  setTimeRange: (value: TimeRangeValue) => void;
  refresh: () => void;
  refreshKey: string;
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
  const { timeRange, absoluteTimeRange, refresh, refreshKey, setTimeRange } = useTimeRangeContext();
  return { timeRange, absoluteTimeRange, refresh, refreshKey, setTimeRange };
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { timeRange, children, onChange } = props;

  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(refreshKey + 1);
  }, [refreshKey]);

  const ctx = useMemo(() => {
    const absoluteTimeRange = isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
    const setTimeRange = (value: TimeRangeValue) => {
      onChange(value);
    };
    return {
      timeRange,
      absoluteTimeRange,
      refresh,
      setTimeRange,
      refreshKey: `${absoluteTimeRange.start}:${absoluteTimeRange.end}:${refreshKey}`,
    };
  }, [timeRange, refresh, refreshKey, onChange]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
