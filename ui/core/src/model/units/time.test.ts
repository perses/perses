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

import {
  AbsoluteTimeRange,
  formatDuration,
  FormatTestCase,
  IntervalTestCase,
  intervalToPrometheusDuration,
} from '@perses-dev/core';
import { Duration } from 'date-fns';
import { formatValue } from './units';
import { UnitTestCase } from './types';

const TIME_TESTS: UnitTestCase[] = [
  {
    value: 0,
    format: { unit: 'milliseconds' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'seconds' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'minutes' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'hours' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'days' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'weeks' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'months' },
    expected: '0s',
  },
  {
    value: 0,
    format: { unit: 'years' },
    expected: '0s',
  },
  {
    value: 0.001,
    format: { unit: 'milliseconds' },
    expected: '0.001ms',
  },
  {
    value: 0.001,
    format: { unit: 'seconds' },
    expected: '1ms',
  },
  {
    value: 0.001,
    format: { unit: 'minutes' },
    expected: '60ms',
  },
  {
    value: 0.001,
    format: { unit: 'hours' },
    expected: '3.6s',
  },
  {
    value: 0.001,
    format: { unit: 'days' },
    expected: '1.44m',
  },
  {
    value: 0.001,
    format: { unit: 'weeks' },
    expected: '10.1m',
  },
  {
    value: 0.001,
    format: { unit: 'months' },
    expected: '43.2m',
  },
  {
    value: 0.001,
    format: { unit: 'years' },
    expected: '8.76h',
  },
  {
    value: 1,
    format: { unit: 'milliseconds' },
    expected: '1ms',
  },
  {
    value: 1,
    format: { unit: 'seconds' },
    expected: '1s',
  },
  {
    value: 1,
    format: { unit: 'minutes' },
    expected: '1m',
  },
  {
    value: 1,
    format: { unit: 'hours' },
    expected: '1h',
  },
  {
    value: 1,
    format: { unit: 'days' },
    expected: '1d',
  },
  {
    value: 1,
    format: { unit: 'weeks' },
    expected: '1w',
  },
  {
    value: 1,
    format: { unit: 'months' },
    expected: '1 month',
  },
  {
    value: 1,
    format: { unit: 'years' },
    expected: '1 year',
  },
  {
    value: 100,
    format: { unit: 'milliseconds' },
    expected: '100ms',
  },
  {
    value: 100,
    format: { unit: 'seconds' },
    expected: '1.67m',
  },
  {
    value: 100,
    format: { unit: 'minutes' },
    expected: '1.67h',
  },
  {
    value: 100,
    format: { unit: 'hours' },
    expected: '4.17d',
  },
  {
    value: 100,
    format: { unit: 'days' },
    expected: '3.33 months',
  },
  {
    value: 100,
    format: { unit: 'weeks' },
    expected: '1.92 years',
  },
  {
    value: 100,
    format: { unit: 'months' },
    expected: '8.22 years',
  },
  {
    value: 100,
    format: { unit: 'years' },
    expected: '100 years',
  },
];
describe('formatValue', () => {
  it.each(TIME_TESTS)('returns $expected when $value formatted as $format', (args: UnitTestCase) => {
    const { value, format: format, expected } = args;
    expect(formatValue(value, format)).toEqual(expected);
  });
});

const INTERVAL_TO_PROMETHEUS_DURATION: IntervalTestCase[] = [
  {
    timeRange: {
      start: new Date(1998, 0, 1),
      end: new Date(1998, 0, 2),
    } as AbsoluteTimeRange,
    expected: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
  },
  {
    timeRange: {
      start: new Date(1998, 0, 1),
      end: new Date(1998, 0, 8),
    } as AbsoluteTimeRange,
    expected: {
      years: 0,
      months: 0,
      weeks: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
  },
  {
    timeRange: {
      start: new Date(1998, 0, 1, 0, 0, 0),
      end: new Date(1998, 0, 1, 2, 10, 30),
    } as AbsoluteTimeRange,
    expected: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 2,
      minutes: 10,
      seconds: 30,
    } as Duration,
  },
  {
    timeRange: {
      start: new Date(1998, 0, 1, 0, 0, 0),
      end: new Date(1998, 0, 366, 0, 0, 0),
    } as AbsoluteTimeRange,
    expected: {
      years: 1,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
  },
  {
    timeRange: {
      start: new Date(1998, 0, 1, 0, 0, 0),
      end: new Date(1998, 0, 31, 0, 0, 0),
    } as AbsoluteTimeRange,
    expected: {
      years: 0,
      months: 0,
      weeks: 4,
      days: 2,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
  },
];
describe('intervalToPrometheusDuration', () => {
  it.each(INTERVAL_TO_PROMETHEUS_DURATION)(
    'returns $expected when time range is $timeRange',
    (args: IntervalTestCase) => {
      const { timeRange, expected } = args;
      expect(intervalToPrometheusDuration(timeRange)).toEqual(expected);
    }
  );
});

const FORMAT_DURATION_TESTS: FormatTestCase[] = [
  {
    duration: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
    expected: '1d',
  },
  {
    duration: {
      years: 10,
      months: 0,
      weeks: 8,
      days: 7,
      hours: 6,
      minutes: 5,
      seconds: 4,
    } as Duration,
    expected: '10y8w7d6h5m4s',
  },
  {
    duration: {
      years: 0,
      months: 100, // Months are ignored
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0,
    } as Duration,
    expected: '1d',
  },
  {
    duration: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 1,
      hours: 0,
      minutes: 0,
      seconds: 0.255,
    } as Duration,
    expected: '1d255ms',
  },
];
describe('formatDuration', () => {
  it.each(FORMAT_DURATION_TESTS)(
    'returns $expected when $duration formatted as DurationString',
    (args: FormatTestCase) => {
      const { duration, expected } = args;
      expect(formatDuration(duration)).toEqual(expected);
    }
  );
});
