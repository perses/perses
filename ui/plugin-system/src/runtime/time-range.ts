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

import { createContext, useContext, useMemo } from 'react';
import { AbsoluteTimeRange, TimeRangeValue, isRelativeTimeRange, toAbsoluteTimeRange } from '@perses-dev/core';

export interface TimeRange {
  initialTimeRange: TimeRangeValue; // value from query string or dashboard spec
  timeRange: TimeRangeValue; // resolved absolute time
  setTimeRange: (value: TimeRangeValue) => void;
}

export interface ResolvedTimeRange {
  timeRange: AbsoluteTimeRange;
  setTimeRange: (value: AbsoluteTimeRange) => void;
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
export function useTimeRange(): ResolvedTimeRange {
  const { timeRange, setTimeRange } = useTimeRangeContext();
  const resolvedTimeRange = useMemo(() => {
    return isRelativeTimeRange(timeRange) ? toAbsoluteTimeRange(timeRange) : timeRange;
  }, [timeRange]);
  return { timeRange: resolvedTimeRange, setTimeRange };
}
