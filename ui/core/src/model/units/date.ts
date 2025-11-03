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

import { UnitGroupConfig, UnitConfig } from './types';

// Time Range Management (similar to Grafana)
export interface DateTime extends Date {
  add(amount: number, unit: string): DateTime;
  subtract(amount: number, unit: string): DateTime;
  format(format?: string): string;
  unix(): number;
  valueOf(): number;
}

export interface RawTimeRange {
  from: DateTime | string;
  to: DateTime | string;
}

export interface TimeRange {
  from: DateTime;
  to: DateTime;
  raw: RawTimeRange;
}

export interface UnixTimeRange {
  from: number;
  to: number;
}

export interface IntervalValues {
  interval: string; // 10s,5m
  intervalMs: number;
}

export type TimeZoneUtc = 'utc';
export type TimeZoneBrowser = 'browser';
export type TimeZone = TimeZoneBrowser | TimeZoneUtc | string;

export const DefaultTimeZone: TimeZone = 'browser';

export interface TimeOption {
  from: string;
  to: string;
  display: string;
  section: number;
}

export interface TimeOptions {
  [key: string]: TimeOption[];
}

export type TimeFragment = string | DateTime;

export const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

type DateUnits =
  | 'datetime-iso'
  | 'datetime-us'
  | 'datetime-local'
  | 'date-iso'
  | 'date-us'
  | 'date-local'
  | 'time-local'
  | 'time-iso'
  | 'time-us'
  | 'relative-time'
  | 'unix-timestamp'
  | 'unix-timestamp-ms';

export type DateFormatOptions = {
  unit?: DateUnits;
  /**
   * The locale to use for formatting. Defaults to the system's locale.
   */
  locale?: string;
  /**
   * The timezone to use for formatting. Defaults to the user's local timezone.
   */
  timeZone?: string;
  /**
   * For relative time formatting, the reference time to compare against.
   * Defaults to current time.
   */
  referenceTime?: number;
  /**
   * This property is not used for date formatting, but is included for
   * compatibility with the FormatControls UI component.
   */
  decimalPlaces?: number;
};

const DATE_GROUP = 'Date';

export const DATE_GROUP_CONFIG: UnitGroupConfig = {
  label: 'Date & Time',
};

export const DATE_UNIT_CONFIG: Readonly<Record<DateUnits, UnitConfig>> = {
  'datetime-iso': {
    group: DATE_GROUP,
    label: 'DateTime (GMT)',
  },
  'datetime-us': {
    group: DATE_GROUP,
    label: 'DateTime (US-East)',
  },
  'datetime-local': {
    group: DATE_GROUP,
    label: 'DateTime (Browser Local)',
  },
  'date-iso': {
    group: DATE_GROUP,
    label: 'Date (GMT)',
  },
  'date-us': {
    group: DATE_GROUP,
    label: 'Date (US-East)',
  },
  'date-local': {
    group: DATE_GROUP,
    label: 'Date (Browser Local)',
  },
  'time-local': {
    group: DATE_GROUP,
    label: 'Time (Browser Local)',
  },
  'time-iso': {
    group: DATE_GROUP,
    label: 'Time (GMT)',
  },
  'time-us': {
    group: DATE_GROUP,
    label: 'Time (US-East)',
  },
  'relative-time': {
    group: DATE_GROUP,
    label: 'Relative Time',
  },
  'unix-timestamp': {
    group: DATE_GROUP,
    label: 'Unix Timestamp (s)',
  },
  'unix-timestamp-ms': {
    group: DATE_GROUP,
    label: 'Unix Timestamp (ms)',
  },
};

/**
 * Converts a numeric value to a Date object.
 * Handles both Unix timestamps (seconds) and millisecond timestamps.
 */
function valueToDate(value: number): Date {
  // Timestamp detection logic with special case handling
  // Main threshold stays at 10 billion to maintain existing behavior
  // Handle special edge cases explicitly

  // Special case: negative timestamps
  if (value < 0) {
    // For negative values, check magnitude to distinguish seconds vs milliseconds
    // Large negative values (> 1 billion in magnitude) are likely milliseconds
    // Small negative values are likely seconds (rare edge case)
    if (Math.abs(value) > 10000000000) {
      return new Date(value); // milliseconds
    } else {
      return new Date(value * 1000); // seconds
    }
  }

  // Special case: year 9999 in seconds (~253402300799)
  // This is a very specific edge case for far-future timestamps
  if (value >= 250000000000 && value <= 260000000000) {
    // Check if this looks like year 9999 in seconds
    const asSeconds = new Date(value * 1000);
    const year = asSeconds.getUTCFullYear();
    if (year >= 9999) {
      return asSeconds; // seconds
    }
  }

  const SECONDS_THRESHOLD = 10000000000; // ~year 2286 - original threshold

  if (value < SECONDS_THRESHOLD) {
    // Assume it's in seconds
    return new Date(value * 1000);
  } else {
    // Assume it's in milliseconds
    return new Date(value);
  }
}

/**
 * Formats a relative time string using the Intl.RelativeTimeFormat API.
 */
function formatRelativeTime(date: Date, referenceTime: number, locale: string): string {
  const referenceDate = new Date(referenceTime);
  const diffMs = date.getTime() - referenceDate.getTime();

  const units = [
    { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
    { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
    { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
    { unit: 'day', ms: 1000 * 60 * 60 * 24 },
    { unit: 'hour', ms: 1000 * 60 * 60 },
    { unit: 'minute', ms: 1000 * 60 },
    { unit: 'second', ms: 1000 },
  ] as const;

  for (const { unit, ms } of units) {
    // Determine the value for the current unit, ensuring it's an integer for Intl.RelativeTimeFormat
    const value = Math.round(diffMs / ms);
    // If the absolute value is 1 or more, use this unit
    if (Math.abs(value) >= 1) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      return rtf.format(value, unit);
    }
  }

  // If less than a second, show "now" or "0 seconds"
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  return rtf.format(0, 'second');
}

/**
 * Gets the browser's preferred locale with comprehensive fallbacks.
 */
const getBrowserLocale = (): string => {
  if (typeof navigator !== 'undefined') {
    if (navigator.language) return navigator.language;
    if (navigator.languages && navigator.languages.length > 0) {
      const firstLanguage = navigator.languages[0];
      if (firstLanguage) return firstLanguage;
    }
    // Legacy fallbacks for older browsers
    const nav = navigator as Navigator & {
      userLanguage?: string;
      browserLanguage?: string;
      systemLanguage?: string;
    };
    if (nav.userLanguage) return nav.userLanguage;
    if (nav.browserLanguage) return nav.browserLanguage;
    if (nav.systemLanguage) return nav.systemLanguage;
  }
  // Node.js or server-side fallback, or if navigator is not available/empty
  return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
};

export function formatDate(value: number, options: DateFormatOptions = {}): string {
  const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    unit = 'datetime-local',
    locale = getBrowserLocale(),
    timeZone = systemTimeZone,
    referenceTime = Date.now(),
  } = options;

  // Handle raw timestamp display
  if (unit === 'unix-timestamp') {
    // Ensure it's in seconds. If it looks like milliseconds, convert.
    const timestamp = value > 1000000000000 ? Math.floor(value / 1000) : value;
    return timestamp.toString();
  }

  if (unit === 'unix-timestamp-ms') {
    // Ensure it's in milliseconds. If it looks like seconds, convert.
    // Use 100 billion as threshold - values < 100B are likely seconds, >= 100B are likely milliseconds
    // This distinguishes between 999999999 (seconds) and 999999999000 (milliseconds)
    const MILLISECONDS_THRESHOLD = 100000000000; // 100 billion
    const timestamp = value < MILLISECONDS_THRESHOLD ? value * 1000 : value;
    return Math.floor(timestamp).toString();
  }

  const date = valueToDate(value);

  // Handle relative time
  if (unit === 'relative-time') {
    return formatRelativeTime(date, referenceTime, locale);
  }

  // Configure Intl.DateTimeFormat options based on unit
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone, // This will be overridden for specific units that need different timezones
  };

  switch (unit) {
    case 'datetime-iso':
      // datetime-iso should ALWAYS show GMT/UTC time
      return date.toISOString();

    case 'datetime-us': {
      // datetime-us should ALWAYS show date in US Eastern timezone
      formatOptions.timeZone = 'America/New_York';
      formatOptions.year = 'numeric';
      formatOptions.month = '2-digit';
      formatOptions.day = '2-digit';
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.second = '2-digit';
      formatOptions.hour12 = true; // 12-hour format with AM/PM
      const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
      return formatter.format(date);
    }

    case 'datetime-local':
      // datetime-local should use the browser's local timezone (detected automatically)
      // Don't override timeZone - let it use the detected system timezone
      formatOptions.year = 'numeric';
      formatOptions.month = '2-digit';
      formatOptions.day = '2-digit';
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.second = '2-digit';
      formatOptions.hour12 = false; // 24-hour format
      break;

    case 'date-iso':
      // date-iso should ALWAYS show GMT/UTC date
      return date.toISOString().split('T')[0]!;

    case 'date-us': {
      // date-us should ALWAYS show date in US Eastern timezone
      formatOptions.timeZone = 'America/New_York';
      formatOptions.year = 'numeric';
      formatOptions.month = '2-digit';
      formatOptions.day = '2-digit';
      const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
      return formatter.format(date);
    }

    case 'date-local':
      formatOptions.year = 'numeric';
      formatOptions.month = '2-digit';
      formatOptions.day = '2-digit';
      break;

    case 'time-local':
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.second = '2-digit';
      formatOptions.hour12 = false; // 24-hour format
      break;

    case 'time-iso':
      // time-iso should ALWAYS show GMT/UTC time
      return date.toISOString().split('T')[1]!.replace('Z', '');

    case 'time-us': {
      // time-us should show time in US-East timezone (Eastern Time)
      formatOptions.timeZone = 'America/New_York';
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      formatOptions.second = '2-digit';
      formatOptions.hour12 = true;
      return new Intl.DateTimeFormat('en-US', formatOptions).format(date);
    }

    default: {
      // This ensures that all DateUnits are handled at compile time.
      const exhaustive: never = unit;
      throw new Error(`Unknown date unit: ${exhaustive}`);
    }
  }

  // For all other units, use Intl.DateTimeFormat with the specified locale and options
  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  return formatter.format(date);
}

// DateTime utility functions (similar to Grafana's moment wrapper)
export function dateTime(input?: number | string | Date): DateTime {
  let date: Date;

  if (input === undefined) {
    date = new Date();
  } else if (typeof input === 'number') {
    date = valueToDate(input);
  } else if (typeof input === 'string') {
    date = new Date(input);
  } else {
    date = new Date(input);
  }

  // Extend the Date object with additional methods
  const extendedDate = date as DateTime;

  extendedDate.add = function (amount: number, unit: string): DateTime {
    const newDate = new Date(this.getTime());

    switch (unit) {
      case 'ms':
      case 'millisecond':
      case 'milliseconds':
        newDate.setMilliseconds(newDate.getMilliseconds() + amount);
        break;
      case 's':
      case 'second':
      case 'seconds':
        newDate.setSeconds(newDate.getSeconds() + amount);
        break;
      case 'm':
      case 'minute':
      case 'minutes':
        newDate.setMinutes(newDate.getMinutes() + amount);
        break;
      case 'h':
      case 'hour':
      case 'hours':
        newDate.setHours(newDate.getHours() + amount);
        break;
      case 'd':
      case 'day':
      case 'days':
        newDate.setDate(newDate.getDate() + amount);
        break;
      case 'w':
      case 'week':
      case 'weeks':
        newDate.setDate(newDate.getDate() + amount * 7);
        break;
      case 'M':
      case 'month':
      case 'months':
        newDate.setMonth(newDate.getMonth() + amount);
        break;
      case 'y':
      case 'year':
      case 'years':
        newDate.setFullYear(newDate.getFullYear() + amount);
        break;
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }

    return dateTime(newDate);
  };

  extendedDate.subtract = function (amount: number, unit: string): DateTime {
    return this.add(-amount, unit);
  };

  extendedDate.format = function (format?: string): string {
    if (!format || format === TIME_FORMAT) {
      return formatDate(this.getTime(), {
        unit: 'datetime-local',
        locale: getBrowserLocale(),
        timeZone: DefaultTimeZone === 'browser' ? undefined : 'UTC',
      });
    }

    // Simple format mapping - extend as needed
    const year = this.getFullYear();
    const month = String(this.getMonth() + 1).padStart(2, '0');
    const day = String(this.getDate()).padStart(2, '0');
    const hours = String(this.getHours()).padStart(2, '0');
    const minutes = String(this.getMinutes()).padStart(2, '0');
    const seconds = String(this.getSeconds()).padStart(2, '0');

    return format
      .replace(/YYYY/g, String(year))
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  };

  extendedDate.unix = function (): number {
    return Math.floor(this.getTime() / 1000);
  };

  extendedDate.valueOf = function (): number {
    return this.getTime();
  };

  return extendedDate;
}

export function getDefaultTimeRange(): TimeRange {
  const now = dateTime();

  return {
    from: dateTime(now).subtract(6, 'hours'),
    to: now,
    raw: { from: 'now-6h', to: 'now' },
  };
}

// Time zone utilities
export function getTimeZone(timeZone?: TimeZone): string {
  if (!timeZone || timeZone === 'browser') {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  if (timeZone === 'utc') {
    return 'UTC';
  }

  return timeZone;
}

// Parse relative time strings like "now-6h", "now-1d", etc.
export function parseTimeRange(from: string, to: string): TimeRange {
  const parseRelativeTime = (timeStr: string, relativeTo: DateTime = dateTime()): DateTime => {
    if (timeStr === 'now') {
      return relativeTo;
    }

    const match = timeStr.match(/^now-(\d+)([smhdwMy])$/);
    if (match && match[1] && match[2]) {
      const amount = parseInt(match[1], 10);
      const unit = match[2];

      const unitMap: { [key: string]: string } = {
        s: 'seconds',
        m: 'minutes',
        h: 'hours',
        d: 'days',
        w: 'weeks',
        M: 'months',
        y: 'years',
      };

      return relativeTo.subtract(amount, unitMap[unit] || unit);
    }

    // Try to parse as absolute time
    return dateTime(timeStr);
  };

  const now = dateTime();
  const fromTime = parseRelativeTime(from, now);
  const toTime = parseRelativeTime(to, now);

  return {
    from: fromTime,
    to: toTime,
    raw: { from, to },
  };
}

// Convert TimeRange to UnixTimeRange (Unix timestamps)
export function convertTimeRangeToUnix(timeRange: TimeRange): UnixTimeRange {
  return {
    from: timeRange.from.unix(),
    to: timeRange.to.unix(),
  };
}
