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

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AbsoluteTimeRange,
  DurationString,
  TimeRangeValue,
  isRelativeTimeRange,
  toAbsoluteTimeRange,
} from '@perses-dev/core';
import { getRefreshIntervalInMs } from './refresh-interval';

export interface TimeRangeProviderProps {
  timeRange: TimeRangeValue;
  refreshInterval?: DurationString;
  setTimeRange?: (value: TimeRangeValue) => void;
  setRefreshInterval?: (value: DurationString) => void;
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
  const { timeRange, refreshInterval, children, setTimeRange, setRefreshInterval } = props;

  const [localTimeRange, setLocalTimeRange] = useState<TimeRangeValue>(timeRange);
  const [localRefreshInterval, setLocalRefreshInterval] = useState<DurationString | undefined>(refreshInterval);

  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    setLocalTimeRange(timeRange);
  }, [timeRange, refreshCounter]);

  useEffect(() => {
    setLocalRefreshInterval(refreshInterval);
  }, [refreshInterval]);

  const refresh = useCallback(() => {
    setRefreshCounter((counter) => counter + 1);
  }, [setRefreshCounter]);

  const ctx = useMemo(() => {
    const absoluteTimeRange = isRelativeTimeRange(localTimeRange)
      ? toAbsoluteTimeRange(localTimeRange)
      : localTimeRange;
    return {
      timeRange: localTimeRange,
      setTimeRange: setTimeRange ?? setLocalTimeRange,
      absoluteTimeRange,
      refresh,
      refreshKey: `${absoluteTimeRange.start}:${absoluteTimeRange.end}:${localRefreshInterval}:${refreshCounter}`,
      refreshInterval: localRefreshInterval,
      refreshIntervalInMs: getRefreshIntervalInMs(localRefreshInterval),
      setRefreshInterval: setRefreshInterval ?? setLocalRefreshInterval,
    };
  }, [localTimeRange, setTimeRange, refresh, refreshCounter, localRefreshInterval, setRefreshInterval]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
