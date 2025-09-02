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

import { useMemo, useCallback, useEffect, useState } from 'react';
import { getUnixTime, isDate } from 'date-fns';
import {
  TimeRangeValue,
  isRelativeTimeRange,
  isDurationString,
  DurationString,
  AbsoluteTimeRange,
} from '@perses-dev/core';
import { createParser, useQueryStates } from 'nuqs';
import { TimeRange } from './TimeRangeProvider';

export type TimeOptionValue = Date | DurationString | null | undefined;

/* Interprets an encoded string and returns either the string or null/undefined if not available */
function getEncodedValue(
  input: string | Array<string | null> | null | undefined,
  allowEmptyString?: boolean
): string | null | undefined {
  // '' or []
  if (!input || (input.length === 0 && (!allowEmptyString || (allowEmptyString && input !== '')))) {
    return null;
  }

  const str = input instanceof Array ? input[0] : input;
  if (str === null || str === undefined) {
    return str;
  }
  if (!allowEmptyString && str === '') {
    return null;
  }

  return str;
}

/* Encodes individual TimeRangeValue as a string, depends on whether start is relative or absolute */
export function encodeTimeRangeValue(timeOptionValue: TimeOptionValue): string {
  if (!timeOptionValue) {
    return '';
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
  if (!paramString) return null;
  return isDurationString(paramString) ? paramString : new Date(Number(paramString));
}

export const parseAsTimeRangeValue = createParser<TimeOptionValue>({
  parse: decodeTimeRangeValue,
  serialize: encodeTimeRangeValue,
  eq: (valueA: TimeOptionValue, valueB: TimeOptionValue) => {
    if (valueA === valueB) return true;
    if (!valueA || !valueB) return valueA === valueB;
    return valueA.valueOf() === valueB.valueOf();
  },
});

export const parseAsTimeRange = {
  start: parseAsTimeRangeValue,
  end: parseAsTimeRangeValue,
};

export const parseAsRefreshInterval = {
  refresh: parseAsTimeRangeValue,
};

/**
 * Gets the initial time range taking into account URL params and dashboard JSON duration
 * Sets start query param if it is empty on page load
 */
export function useInitialTimeRange(dashboardDuration: DurationString): TimeRangeValue {
  const [query] = useQueryStates(parseAsTimeRange, { history: 'replace' });
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
 * Returns time range getter and setter, taking the URL query params.
 */
export function useTimeRangeParams(initialTimeRange: TimeRangeValue): Pick<TimeRange, 'timeRange' | 'setTimeRange'> {
  const [query, setQuery] = useQueryStates(parseAsTimeRange, { history: 'replace' });
  // determine whether initial param had previously been populated to fix back btn
  const [paramsLoaded, setParamsLoaded] = useState<boolean>(false);

  const { start } = query;

  useEffect(() => {
    // when dashboard loaded with no params, default to dashboard duration
    if (!paramsLoaded && !start) {
      if (isRelativeTimeRange(initialTimeRange)) {
        setQuery({ start: initialTimeRange.pastDuration, end: undefined });
        setParamsLoaded(true);
      }
    }
  }, [initialTimeRange, paramsLoaded, start, setQuery]);

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

  return { timeRange: initialTimeRange, setTimeRange: setTimeRange };
}

/**
 * Gets the initial refresh interval taking into account URL params and dashboard JSON duration
 * Sets refresh query param if it is empty on page load
 */
export function useInitialRefreshInterval(dashboardDuration: DurationString): DurationString {
  const [query] = useQueryStates(parseAsRefreshInterval, { history: 'replace' });
  const { refresh } = query;
  return useMemo(() => {
    let initialTimeRange: DurationString = dashboardDuration;
    if (!refresh) {
      return initialTimeRange;
    }
    const startStr = refresh.toString();
    if (isDurationString(startStr)) {
      initialTimeRange = startStr;
    }
    return initialTimeRange;
  }, [dashboardDuration, refresh]);
}

/**
 * Returns refresh interval getter and setter, taking the URL query params.
 */
export function useSetRefreshIntervalParams(
  initialRefreshInterval?: DurationString
): Pick<TimeRange, 'refreshInterval' | 'setRefreshInterval'> {
  const [query, setQuery] = useQueryStates(parseAsRefreshInterval, { history: 'replace' });

  // determine whether initial param had previously been populated to fix back btn
  const [paramsLoaded, setParamsLoaded] = useState<boolean>(false);

  const { refresh } = query;

  useEffect(() => {
    // when dashboard loaded with no params, default to dashboard refresh interval
    if (!paramsLoaded && !refresh) {
      setQuery({ refresh: initialRefreshInterval });
      setParamsLoaded(true);
    }
  }, [initialRefreshInterval, paramsLoaded, refresh, setQuery]);

  const setRefreshInterval: TimeRange['setRefreshInterval'] = useCallback(
    (refresh: DurationString) => setQuery({ refresh }),
    [setQuery]
  );

  return {
    refreshInterval: initialRefreshInterval,
    setRefreshInterval: setRefreshInterval,
  };
}
