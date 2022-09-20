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
import { getUnixTime } from 'date-fns';
import { TimeRangeValue, AbsoluteTimeRange, toAbsoluteTimeRange, isRelativeTimeRange } from '@perses-dev/core';
import { TimeRange, TimeRangeContext, useQueryParams } from '@perses-dev/plugin-system';

export interface TimeRangeProviderProps {
  initialTimeRange: TimeRangeValue;
  children?: React.ReactNode;
  onTimeRangeChange?: (e: TimeRangeValue) => void;
}

/**
 * Provider implementation that supplies the TimeRangeState at runtime.
 */
export function TimeRangeProvider(props: TimeRangeProviderProps) {
  const { initialTimeRange, children, onTimeRangeChange } = props;

  const { queryParams, setQueryParams } = useQueryParams();

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
        if (setQueryParams) {
          queryParams.set('start', value.pastDuration);
          // end not required for relative time but may have been set by AbsoluteTimePicker or zoom
          queryParams.delete('end');
          setQueryParams(queryParams);
        } else {
          setActiveTimeRange(toAbsoluteTimeRange(value));
        }
        return;
      }

      // allows app to specify whether query params should be source of truth for active time range
      if (setQueryParams) {
        const startUnixMs = getUnixTime(timeRange.start) * 1000;
        const endUnixMs = getUnixTime(timeRange.end) * 1000;
        queryParams.set('start', startUnixMs.toString());
        queryParams.set('end', endUnixMs.toString());
        setQueryParams(queryParams);
      } else {
        setActiveTimeRange(value);
      }
    },
    [queryParams, setQueryParams, timeRange, onTimeRangeChange]
  );

  const ctx = useMemo(
    () => ({ initialTimeRange, timeRange, setTimeRange }),
    [initialTimeRange, timeRange, setTimeRange]
  );

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
