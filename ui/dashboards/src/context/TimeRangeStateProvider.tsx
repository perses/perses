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

import { useState, useMemo, createContext, useContext, useCallback } from 'react';
import { AbsoluteTimeRange, RelativeTimeRange, toAbsoluteTimeRange } from '@perses-dev/core';
import { TimeRangeContext } from '@perses-dev/plugin-system';

export interface TimeRangeProviderProps {
  initialValue: RelativeTimeRange;
  children?: React.ReactNode;
}

/**
 * Provider implementation that supplies the TimeRangeState at runtime.
 */
export function TimeRangeStateProvider(props: TimeRangeProviderProps) {
  const { initialValue, children } = props;

  const defaultTimeRange: AbsoluteTimeRange = toAbsoluteTimeRange(initialValue);
  const [timeRange, setActiveTimeRange] = useState<AbsoluteTimeRange>(defaultTimeRange);

  // TODO: add support for passing relative time ranges in setTimeRange, ex: { from: 'now-1h', to: 'now' }
  const setTimeRange: TimeRangeSetter['setTimeRange'] = useCallback((value: AbsoluteTimeRange) => {
    setActiveTimeRange(value);
  }, []);

  const ctx = useMemo(() => ({ timeRange, defaultDuration: initialValue.pastDuration }), [timeRange, initialValue]);

  const setters = useMemo(() => ({ setTimeRange }), [setTimeRange]);

  return (
    <TimeRangeSetterContext.Provider value={setters}>
      <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>
    </TimeRangeSetterContext.Provider>
  );
}

/**
 * Setters for manipulating time range state.
 */
export interface TimeRangeSetter {
  setTimeRange: (value: AbsoluteTimeRange) => void;
}

export const TimeRangeSetterContext = createContext<TimeRangeSetter | undefined>(undefined);

/**
 * Gets the setters for time range selection provided by the TimeRangeStateProvider at runtime.
 */
export function useTimeRangeSetter() {
  const ctx = useContext(TimeRangeSetterContext);
  if (ctx === undefined) {
    throw new Error('No TimeRangeSetterContext found. Did you forget a Provider?');
  }
  return ctx;
}
