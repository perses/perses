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
import { getUnixTime } from 'date-fns';
import {
  TimeRangeValue,
  AbsoluteTimeRange,
  toAbsoluteTimeRange,
  isRelativeTimeRange,
  isDurationString,
  RelativeTimeRange,
  DurationString,
} from '@perses-dev/core';
import { TimeRange, TimeRangeContext, useQueryString, useTimeRange } from '@perses-dev/plugin-system';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  children?: React.ReactNode;
  onTimeRangeChange?: (e: TimeRangeValue) => void;
}

export function useInitialTimeRange(dashboardDuration: DurationString) {
  const { queryString, setQueryString } = useQueryString();

  const startParam = queryString.get('start');
  // const endParam = queryString.get('end');

  let defaultTimeRange: TimeRangeValue = { pastDuration: dashboardDuration };

  useEffect(() => {
    if (startParam === null) {
      if (setQueryString) {
        queryString.set('start', dashboardDuration);
        queryString.delete('end');
        setQueryString(queryString);
      }
    }
  }, [startParam, dashboardDuration, queryString, setQueryString]);

  if (startParam === null) {
    return { defaultTimeRange };
  }

  const startParamString = startParam?.toString() ?? '';
  if (isDurationString(startParamString)) {
    defaultTimeRange = { pastDuration: startParamString } as RelativeTimeRange;
  }
  return { defaultTimeRange };
}

export function useSyncTimeRangeParams() {
  const { queryString, setQueryString } = useQueryString();
  const { timeRange } = useTimeRange();
  const lastParamSync = useRef<{ [k: string]: string }>();

  useEffect(() => {
    // TODO (sjcobb): how to tell whether resolved timeRange was originally relative?
    // if (isRelativeTimeRange(value)) {
    //   if (setQueryString) {
    //     queryString.set('start', value.pastDuration);
    //     // end not required for relative time but may have been set by AbsoluteTimePicker or zoom
    //     queryString.delete('end');
    //     setQueryString(queryString);
    //   } else {
    //     setActiveTimeRange(toAbsoluteTimeRange(value));
    //   }
    //   return;
    // }

    if (setQueryString) {
      // Absolute URL example) ?start=1663707045000&end=1663713330000
      // currently set from ViewDashboard initial queryString, AbsoluteTimePicker, or LineChart panel onDataZoom
      const startUnixMs = getUnixTime(timeRange.start) * 1000;
      const endUnixMs = getUnixTime(timeRange.end) * 1000;
      queryString.set('start', startUnixMs.toString());
      queryString.set('end', endUnixMs.toString());
      setQueryString(queryString); // TODO (sjcobb); only re-set start query param when it changes
      lastParamSync.current = Object.fromEntries([...queryString]);
    }

    // return () => {
    //   // TODO (sjcobb): cleanup
    // };
  }, [timeRange, queryString, setQueryString]);
}

/**
 * Provider implementation that supplies the time range state at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { initialTimeRange, children, onTimeRangeChange } = props;

  const defaultTimeRange: AbsoluteTimeRange = isRelativeTimeRange(initialTimeRange)
    ? toAbsoluteTimeRange(initialTimeRange)
    : initialTimeRange;

  const [timeRange, setActiveTimeRange] = useState<AbsoluteTimeRange>(defaultTimeRange);

  const setTimeRange: TimeRange['setTimeRange'] = useCallback(
    (value: TimeRangeValue) => {
      if (onTimeRangeChange !== undefined) {
        // optional callback to override default behavior
        onTimeRangeChange(value);
        return;
      }

      // convert to absolute time range if relative time shortcut passed from TimeRangeControls
      if (isRelativeTimeRange(value)) {
        setActiveTimeRange(toAbsoluteTimeRange(value));
        return;
      }

      // assume value was already absolute
      setActiveTimeRange(value);
    },
    [onTimeRangeChange]
  );

  const ctx = useMemo(() => ({ timeRange, setTimeRange }), [timeRange, setTimeRange]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
