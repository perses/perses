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
