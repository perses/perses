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

import { UnitGroupConfig, UnitConfig } from './types';

const timeUnitKinds = ['Milliseconds', 'Seconds', 'Minutes', 'Hours', 'Days', 'Weeks', 'Months', 'Years'] as const;
type TimeUnitKind = typeof timeUnitKinds[number];
export type TimeUnitOptions = {
  kind: TimeUnitKind;
};
const TIME_GROUP = 'Time';
export const TIME_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Time',
};
export const TIME_UNIT_CONFIG: Readonly<Record<TimeUnitKind, UnitConfig>> = {
  Milliseconds: {
    group: TIME_GROUP,
    label: 'Milliseconds',
  },
  Seconds: {
    group: TIME_GROUP,
    label: 'Seconds',
  },
  Minutes: {
    group: TIME_GROUP,
    label: 'Minutes',
  },
  Hours: {
    group: TIME_GROUP,
    label: 'Hours',
  },
  Days: {
    group: TIME_GROUP,
    label: 'Days',
  },
  Weeks: {
    group: TIME_GROUP,
    label: 'Weeks',
  },
  Months: {
    group: TIME_GROUP,
    label: 'Months',
  },
  Years: {
    group: TIME_GROUP,
    label: 'Years',
  },
};

// Mapping of time units to what Intl.NumberFormat formatter expects
// https://v8.dev/features/intl-numberformat#units
export enum TimeIntlDuration {
  Milliseconds = 'millisecond',
  Seconds = 'second',
  Minutes = 'minute',
  Hours = 'hour',
  Days = 'day',
  Weeks = 'week',
  Months = 'month',
  Years = 'year',
}

export function formatTime(value: number, unitOptions: TimeUnitOptions): string {
  const timeUnit: string = TimeIntlDuration[unitOptions.kind];
  const formatter = new Intl.NumberFormat('en', {
    style: 'unit',
    unit: timeUnit,
    unitDisplay: 'long',
  });
  return formatter.format(value);
}
