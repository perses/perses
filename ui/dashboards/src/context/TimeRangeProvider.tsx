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

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getUnixTime } from 'date-fns';
import { TimeRangeValue, AbsoluteTimeRange, toAbsoluteTimeRange, isRelativeTimeRange } from '@perses-dev/core';
import { TimeRange, TimeRangeContext, useQueryString, useTimeRange } from '@perses-dev/plugin-system';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  children?: React.ReactNode;
  onTimeRangeChange?: (e: TimeRangeValue) => void;
}

export function useSyncTimeRangeParams() {
  // const [coords, setCoords] = useState<CursorData['coords']>(null);
  const { queryString, setQueryString } = useQueryString();
  const { timeRange } = useTimeRange();

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
      setQueryString(queryString);
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

  const { queryString, setQueryString } = useQueryString();

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

      if (isRelativeTimeRange(value)) {
        if (setQueryString) {
          setActiveTimeRange(toAbsoluteTimeRange(value));
        } else {
          setActiveTimeRange(toAbsoluteTimeRange(value));
        }
        return;
      }

      // allows app to specify whether query params should be source of truth for active time range
      if (setQueryString) {
        setActiveTimeRange(value);
      } else {
        setActiveTimeRange(value);
      }

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

      // // allows app to specify whether query params should be source of truth for active time range
      // if (setQueryString) {
      //   // Absolute URL example) ?start=1663707045000&end=1663713330000
      //   // currently set from ViewDashboard initial queryString, AbsoluteTimePicker, or LineChart panel onDataZoom
      //   const startUnixMs = getUnixTime(value.start) * 1000;
      //   const endUnixMs = getUnixTime(value.end) * 1000;
      //   queryString.set('start', startUnixMs.toString());
      //   queryString.set('end', endUnixMs.toString());
      //   setQueryString(queryString);
      // } else {
      //   setActiveTimeRange(value);
      // }
    },
    [queryString, setQueryString, onTimeRangeChange]
  );

  const ctx = useMemo(() => ({ timeRange, setTimeRange }), [timeRange, setTimeRange]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
