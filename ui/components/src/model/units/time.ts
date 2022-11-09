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

import { Duration, milliseconds } from 'date-fns';
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

export function formatTime(value: number, unitOptions: TimeUnitOptions): string {
  // Create a Duration from the value based on what time unit it is
  const duration: Duration = {};
  switch (unitOptions.kind) {
    case 'Milliseconds':
      duration.seconds = value / 1000;
      break;
    case 'Seconds':
      duration.seconds = value;
      break;
    case 'Minutes':
      duration.minutes = value;
      break;
    case 'Hours':
      duration.hours = value;
      break;
    case 'Days':
      duration.days = value;
      break;
    case 'Weeks':
      duration.weeks = value;
      break;
    case 'Months':
      duration.months = value;
      break;
    case 'Years':
      duration.years = value;
      break;
    default: {
      const exhaustive: never = unitOptions.kind;
      throw new Error(`Unknown time unit type ${exhaustive}`);
    }
  }

  // Find the largest whole time unit we can display the value in and use it
  const ms = milliseconds(duration);
  const seconds = ms / 1000;
  if (seconds < 1) {
    return `${ms.toFixed()} milliseconds`;
  }

  const minutes = seconds / 60;
  if (minutes < 1) {
    return `${seconds.toFixed()} seconds`;
  }

  const hours = minutes / 60;
  if (hours < 1) {
    return `${minutes.toFixed()} minutes`;
  }

  const days = hours / 24;
  if (days < 1) {
    return `${hours.toFixed()} hours`;
  }

  const weeks = days / 7;
  if (weeks < 1) {
    return `${days.toFixed()} days`;
  }

  const years = weeks / 52;
  if (years < 1) {
    return `${weeks.toFixed()} weeks`;
  }

  return `${years.toFixed()} years`;
}
