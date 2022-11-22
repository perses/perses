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

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useQueryParams, QueryParamConfig } from 'use-query-params';
import { getUnixTime, isDate } from 'date-fns';
import {
  TimeRangeValue,
  isRelativeTimeRange,
  isDurationString,
  DurationString,
  AbsoluteTimeRange,
} from '@perses-dev/core';
import { TimeRange } from './TimeRangeProvider';

export type TimeOptionValue = Date | DurationString | null | undefined;

/* Interprets an encoded string and returns either the string or null/undefined if not available */
function getEncodedValue(
  input: string | Array<string | null> | null | undefined,
  allowEmptyString?: boolean
): string | null | undefined {
  if (input == null) {
    return input;
  }
  // '' or []
  if (input.length === 0 && (!allowEmptyString || (allowEmptyString && input !== ''))) {
    return null;
  }

  const str = input instanceof Array ? input[0] : input;
  if (str == null) {
    return str;
  }
  if (!allowEmptyString && str === '') {
    return null;
  }

  return str;
}

/* Encodes individual TimeRangeValue as a string, depends on whether start is relative or absolute */
export function encodeTimeRangeValue(timeOptionValue: TimeOptionValue): string | null | undefined {
  if (!timeOptionValue) {
    return timeOptionValue;
  }

  if (typeof timeOptionValue === 'string') {
    if (isDurationString(timeOptionValue)) {
      return timeOptionValue;
    }
  }
  return (getUnixTime(timeOptionValue) * 1000).toString();
}

/* Converts param input to supported relative or absolute time range format */
export function decodeTimeRangeValue(
  input: string | Array<string | null> | null | undefined
): Date | DurationString | null | undefined {
  const paramString = getEncodedValue(input);
  if (paramString == null) return paramString;
  return isDurationString(paramString) ? paramString : new Date(Number(paramString));
}

/**
 * Custom TimeRangeValue param type
 * See: https://github.com/pbeshai/use-query-params/tree/master/packages/serialize-query-params#param-types
 */
export const TimeRangeParam: QueryParamConfig<TimeOptionValue, TimeOptionValue> = {
  encode: encodeTimeRangeValue,
  decode: decodeTimeRangeValue,
  equals: (valueA: TimeOptionValue, valueB: TimeOptionValue) => {
    if (valueA === valueB) return true;
    if (valueA == null || valueB == null) return valueA === valueB;
    return valueA.valueOf() === valueB.valueOf();
  },
};

export const timeRangeQueryConfig = {
  start: TimeRangeParam,
  end: TimeRangeParam,
};

/**
 * Gets the initial time range taking into account URL params and dashboard JSON duration
 * Sets start query param if it is empty on page load
 */
export function useInitialTimeRange(dashboardDuration: DurationString): TimeRangeValue {
  const [query] = useQueryParams(timeRangeQueryConfig, { updateType: 'replaceIn' });
  const { start, end } = query;
  return useMemo(() => {
    let initialTimeRange: TimeRangeValue = { pastDuration: dashboardDuration };
    if (!start) {
      return initialTimeRange;
    }
    const startStr = start.toString();
    if (isDurationString(startStr)) {
      initialTimeRange = { pastDuration: startStr };
    } else if (isDate(start) && isDate(end)) {
      initialTimeRange = { start: start, end: end } as AbsoluteTimeRange;
    }
    return initialTimeRange;
  }, [start, end, dashboardDuration]);
}

/**
 * Returns time range getter and setter, set enabledURLParams to false to disable query string serialization
 */
export function useSetTimeRangeParams(
  initialTimeRange: TimeRangeValue,
  enabledURLParams = true
): Pick<TimeRange, 'timeRange' | 'setTimeRange'> {
  const [query, setQuery] = useQueryParams(timeRangeQueryConfig, { updateType: 'replaceIn' });

  // determine whether initial param had previously been populated to fix back btn
  const [paramsLoaded, setParamsLoaded] = useState<boolean>(false);

  // optional fallback when app does not want query string as source of truth
  // this occurs when enabledURLParams is set to false on TimeRangeProvider
  const [timeRangeState, setTimeRangeState] = useState<TimeRangeValue>(initialTimeRange);

  const { start } = query;

  useEffect(() => {
    // when dashboard loaded with no params, default to dashboard duration
    if (enabledURLParams && !paramsLoaded && !start) {
      if (isRelativeTimeRange(initialTimeRange)) {
        setQuery({ start: initialTimeRange.pastDuration, end: undefined });
        setParamsLoaded(true);
      }
    }
  }, [initialTimeRange, enabledURLParams, paramsLoaded, start, setQuery]);

  const setTimeRange: TimeRange['setTimeRange'] = useCallback(
    (value: TimeRangeValue) => {
      if (isRelativeTimeRange(value)) {
        setQuery({ start: value.pastDuration, end: undefined });
      } else {
        setQuery(value);
      }
    },
    [setQuery]
  );

  if (!enabledURLParams) {
    return { timeRange: timeRangeState, setTimeRange: setTimeRangeState };
  }
  return { timeRange: initialTimeRange, setTimeRange: setTimeRange };
}
