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
    unit: { kind: 'Milliseconds' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Seconds' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Minutes' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Hours' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Days' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Weeks' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Months' },
    expected: '0s',
  },
  {
    value: 0,
    unit: { kind: 'Years' },
    expected: '0s',
  },
  {
    value: 0.001,
    unit: { kind: 'Milliseconds' },
    expected: '0.001ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Seconds' },
    expected: '1ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Minutes' },
    expected: '60ms',
  },
  {
    value: 0.001,
    unit: { kind: 'Hours' },
    expected: '3.6s',
  },
  {
    value: 0.001,
    unit: { kind: 'Days' },
    expected: '1.44m',
  },
  {
    value: 0.001,
    unit: { kind: 'Weeks' },
    expected: '10.1m',
  },
  {
    value: 0.001,
    unit: { kind: 'Months' },
    expected: '43.2m',
  },
  {
    value: 0.001,
    unit: { kind: 'Years' },
    expected: '8.76h',
  },
  {
    value: 1,
    unit: { kind: 'Milliseconds' },
    expected: '1ms',
  },
  {
    value: 1,
    unit: { kind: 'Seconds' },
    expected: '1s',
  },
  {
    value: 1,
    unit: { kind: 'Minutes' },
    expected: '1m',
  },
  {
    value: 1,
    unit: { kind: 'Hours' },
    expected: '1h',
  },
  {
    value: 1,
    unit: { kind: 'Days' },
    expected: '1d',
  },
  {
    value: 1,
    unit: { kind: 'Weeks' },
    expected: '1w',
  },
  {
    value: 1,
    unit: { kind: 'Months' },
    expected: '1 month',
  },
  {
    value: 1,
    unit: { kind: 'Years' },
    expected: '1 year',
  },
  {
    value: 100,
    unit: { kind: 'Milliseconds' },
    expected: '100ms',
  },
  {
    value: 100,
    unit: { kind: 'Seconds' },
    expected: '1.67m',
  },
  {
    value: 100,
    unit: { kind: 'Minutes' },
    expected: '1.67h',
  },
  {
    value: 100,
    unit: { kind: 'Hours' },
    expected: '4.17d',
  },
  {
    value: 100,
    unit: { kind: 'Days' },
    expected: '3.33 months',
  },
  {
    value: 100,
    unit: { kind: 'Weeks' },
    expected: '1.92 years',
  },
  {
    value: 100,
    unit: { kind: 'Months' },
    expected: '8.22 years',
  },
  {
    value: 100,
    unit: { kind: 'Years' },
    expected: '100 years',
  },
];
describe('formatValue', () => {
  it.each(TIME_TESTS)('returns $expected when $value formatted as $unit', (args: UnitTestCase) => {
    const { value, unit, expected } = args;
    expect(formatValue(value, unit)).toEqual(expected);
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
    expected: '10y 8w 7d 6h 5m 4s',
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
