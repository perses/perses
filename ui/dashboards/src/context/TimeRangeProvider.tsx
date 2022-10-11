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

import React, { useState, useMemo, useCallback } from 'react';
import { TimeRangeValue, AbsoluteTimeRange, toAbsoluteTimeRange, isRelativeTimeRange } from '@perses-dev/core';
import { TimeRange, TimeRangeContext, useTimeRangeContext } from '@perses-dev/plugin-system';
import { useSyncActiveTimeRange } from '../utils/time-range-params';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  children?: React.ReactNode;
  onTimeRangeChange?: (e: TimeRangeValue) => void;
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { initialTimeRange, children, onTimeRangeChange } = props;

  const defaultTimeRange: AbsoluteTimeRange = isRelativeTimeRange(initialTimeRange)
    ? toAbsoluteTimeRange(initialTimeRange)
    : initialTimeRange;

  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRangeValue>(initialTimeRange);

  const [timeRange, setActiveTimeRange] = useState<AbsoluteTimeRange>(defaultTimeRange);

  const setTimeRange: TimeRange['setTimeRange'] = useCallback(
    (value: TimeRangeValue) => {
      if (onTimeRangeChange !== undefined) {
        // optional callback to override default behavior
        onTimeRangeChange(value);
        return;
      }

      // needed for TimeRangeControls since absolute time calendar and relative time shortcuts supported
      setSelectedTimeRange(value);

      // convert to absolute time range if relative time shortcut passed
      if (isRelativeTimeRange(value)) {
        setActiveTimeRange(toAbsoluteTimeRange(value));
        return;
      }

      // resolved time, assume value was already absolute
      setActiveTimeRange(value);
    },
    [onTimeRangeChange, setSelectedTimeRange]
  );

  // ensure time range updates when back btn pressed
  useSyncActiveTimeRange(setActiveTimeRange);

  const ctx = useMemo(
    () => ({ timeRange, setTimeRange, selectedTimeRange, initialTimeRange }),
    [timeRange, setTimeRange, selectedTimeRange, initialTimeRange]
  );

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}

/**
 * Internal version of time range hook to get all supported values
 */
export function useDashboardTimeRange() {
  const { initialTimeRange, selectedTimeRange, timeRange, setTimeRange } = useTimeRangeContext();
  return { initialTimeRange, selectedTimeRange, timeRange, setTimeRange };
}
