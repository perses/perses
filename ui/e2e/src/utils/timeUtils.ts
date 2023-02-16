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

import { zonedTimeToUtc } from 'date-fns-tz';

/**
 * Takes a generic date string and converts it to a date at that time in the
 * specified time zone configured for Playwright. Important to use this when
 * doing date processing in test code to avoid tests that behave differently
 * depending on the machine that runs them.
 *
 * @param date - String representatino of a date without time zone information (e.g. 2022-01-01 10:01:00)
 * @param timezoneId - Playwright's configured time zone.
 */
export function parseDateIntoTimeZone(date: string, timezoneId?: string): Date {
  if (!timezoneId) {
    // Adding this check because the types from Playwright have timezoneId as
    // optional. In practice, our playwright config always has this value set.
    throw new Error('Missing time zone');
  }

  return zonedTimeToUtc(date, timezoneId);
}
