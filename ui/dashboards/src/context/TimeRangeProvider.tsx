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

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQueryParams, DecodedValueMap, StringParam } from 'use-query-params';
import { getUnixTime, sub } from 'date-fns';
import {
  TimeRangeValue,
  AbsoluteTimeRange,
  toAbsoluteTimeRange,
  isRelativeTimeRange,
  isDurationString,
  RelativeTimeRange,
  DurationString,
  isAbsoluteTimeRange,
  parseDurationString,
} from '@perses-dev/core';
import { TimeRange, TimeRangeContext } from '@perses-dev/plugin-system';
import { useSelectedTimeRangeStore } from './DashboardProvider';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  children?: React.ReactNode;
  onTimeRangeChange?: (e: TimeRangeValue) => void;
}

const queryConfig = {
  start: StringParam,
  end: StringParam,
};

/**
 * Gets the initial time range taking into account URL params and dashboard JSON duration
 */
export function useInitialTimeRange(dashboardDuration: DurationString): TimeRangeValue {
  const [query, setQuery] = useQueryParams(queryConfig);
  const { start, end } = query;

  return useMemo(() => {
    let initialTimeRange: TimeRangeValue = { pastDuration: dashboardDuration };
    if (!start) {
      setQuery({ start: dashboardDuration });
      return initialTimeRange;
    }

    if (isDurationString(start.toString())) {
      initialTimeRange = { pastDuration: start } as RelativeTimeRange;
    } else {
      initialTimeRange = {
        start: new Date(Number(start)),
        end: end ? new Date(Number(end)) : new Date(),
      };
    }
    return initialTimeRange;
  }, [start, end, dashboardDuration, setQuery]);
}

/**
 * Set initial start and end URL params and update when selected time range changes
 */
export function useSyncTimeRange() {
  const { selectedTimeRange } = useSelectedTimeRangeStore();
  const [query, setQuery] = useQueryParams(queryConfig);
  const lastParamSync = useRef<DecodedValueMap<typeof queryConfig>>();

  useEffect(() => {
    const lastStart = (lastParamSync.current && lastParamSync.current.start) ?? '';
    if (isRelativeTimeRange(selectedTimeRange)) {
      // back btn not pressed, set new time range params
      if (lastStart !== selectedTimeRange.pastDuration) {
        setQuery({ start: selectedTimeRange.pastDuration, end: undefined });
        lastParamSync.current = query;
      }
    } else if (isAbsoluteTimeRange(selectedTimeRange)) {
      const lastStartFormatted = isDurationString(lastStart)
        ? sub(selectedTimeRange.end, parseDurationString(lastStart)) // in case previous timeRange was relative
        : new Date(Number(lastStart));
      // back button not pressed, set new params
      if (getUnixTime(lastStartFormatted) !== getUnixTime(selectedTimeRange.start)) {
        const startUnixMs = (getUnixTime(selectedTimeRange.start) * 1000).toString();
        const endUnixMs = (getUnixTime(selectedTimeRange.end) * 1000).toString();
        setQuery({ start: startUnixMs, end: endUnixMs });
        lastParamSync.current = query;
      }
    }
  }, [query, setQuery, selectedTimeRange]);
}

/**
 * Ensure dashboard time range matches query params, needed for back button to work
 */
export function useSyncActiveTimeRange(setActiveTimeRange: (value: AbsoluteTimeRange) => void) {
  const [query] = useQueryParams({
    start: '',
    end: '',
  });
  const { start, end } = query;

  useEffect(() => {
    if (start && isDurationString(start)) {
      const convertedTime = toAbsoluteTimeRange({ pastDuration: start });
      setActiveTimeRange(convertedTime);
    } else {
      setActiveTimeRange({ start: new Date(Number(start)), end: new Date(Number(end)) });
    }
  }, [start, end, setActiveTimeRange]);
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { initialTimeRange, children, onTimeRangeChange } = props;

  const defaultTimeRange: AbsoluteTimeRange = isRelativeTimeRange(initialTimeRange)
    ? toAbsoluteTimeRange(initialTimeRange)
    : initialTimeRange;

  const { selectedTimeRange, setSelectedTimeRange } = useSelectedTimeRangeStore();

  const [timeRange, setActiveTimeRange] = useState<AbsoluteTimeRange>(defaultTimeRange);

  const setTimeRange: TimeRange['setTimeRange'] = useCallback(
    (value: TimeRangeValue) => {
      if (onTimeRangeChange !== undefined) {
        // optional callback to override default behavior
        onTimeRangeChange(value);
        return;
      }

      setSelectedTimeRange(value);

      // convert to absolute time range if relative time shortcut passed from TimeRangeControls
      if (isRelativeTimeRange(value)) {
        setActiveTimeRange(toAbsoluteTimeRange(value));
        return;
      }

      // assume value was already absolute
      setActiveTimeRange(value);
    },
    [onTimeRangeChange, setSelectedTimeRange]
  );

  useSyncActiveTimeRange(setActiveTimeRange);

  const ctx = useMemo(
    () => ({ timeRange, selectedTimeRange, setTimeRange }),
    [timeRange, selectedTimeRange, setTimeRange]
  );

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
