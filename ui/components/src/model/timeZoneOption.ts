// Copyright 2025 The Perses Authors
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

import { DEFAULT_DASHBOARD_TIMEZONE } from '@perses-dev/core';
import memoize from 'lodash/memoize';

export interface TimeZoneOption {
  value: string;
  label: string;
  longOffset: string;
}

// Instead of adding another dependency which returns an array of time zones, we can use the built-in Intl object
// memoizing this because the list of time zones is relatively expensive to compute with 400+ entries
export const DEFAULT_TIMEZONE_OPTIONS = memoize(() => Intl.supportedValuesOf('timeZone'));

// Get the time zone offset for a given time zone
export const getTimeZoneOffset = (timeZone: string): Intl.DateTimeFormatPart | undefined => {
  const defaultLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  // longOffset is returned as either GMT+-<offset>, UTC+-<offset> or just GMT/UTC
  const longOffset = Intl.DateTimeFormat(defaultLocale, { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(new Date())
    .find((part) => part.type === 'timeZoneName');
  return longOffset
    ? {
        ...longOffset,
        // we want some consistency in the format of the offset, so if it's just GMT/UTC, we add +00:00
        value: !(longOffset.value.includes('+') || longOffset.value.includes('-'))
          ? `${longOffset.value}+00:00`
          : longOffset.value,
      }
    : undefined;
};

export const getTimeZoneOptions = memoize((): TimeZoneOption[] => {
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // define a browser time zone option
  const BROWSER_TIME_ZONE: TimeZoneOption = {
    value: DEFAULT_DASHBOARD_TIMEZONE,
    label: `${localTimeZone} (default)`,
    longOffset: getTimeZoneOffset(localTimeZone)?.value || '',
  };
  // define a UTC time zone option
  const UTC: TimeZoneOption = { value: 'UTC', label: 'UTC, GMT', longOffset: 'UTC+00:00' };

  return (
    // putting UTC and local time zone options first for better user experience
    ['UTC', DEFAULT_DASHBOARD_TIMEZONE, ...DEFAULT_TIMEZONE_OPTIONS()]
      .map((timeZone) => {
        // return defined BROWSER_TIME_ZONE if timeZone is DEFAULT_DASHBOARD_TIMEZONE
        if (timeZone === DEFAULT_DASHBOARD_TIMEZONE) {
          return BROWSER_TIME_ZONE;
        }
        // return defined UTC if timeZone is 'UTC'
        if (timeZone === 'UTC') {
          return UTC;
        }
        // return empty object if timeZone matches localTimeZone because we already returned it as BROWSER_TIME_ZONE
        // avoid returning duplicate options
        if (timeZone === localTimeZone) {
          return { value: '', label: '', longOffset: '' };
        }
        const longOffset = getTimeZoneOffset(timeZone);
        return {
          value: timeZone,
          label: timeZone.replaceAll('_', ' '),
          longOffset: longOffset ? longOffset.value : '',
        };
      })
      // filter out objects with empty value
      .filter((option) => option.value !== '')
  );
});
