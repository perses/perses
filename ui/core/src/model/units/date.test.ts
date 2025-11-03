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

import { formatDate, DateFormatOptions } from './date';

// Test timestamp: January 1, 2024, 12:30:45 UTC
const TEST_TIMESTAMP_MS = 1704112245000; // milliseconds - correct timestamp for 12:30:45
const TEST_TIMESTAMP_S = 1704112245; // seconds

// For consistent testing, create a reference date
const REFERENCE_TIME = new Date('2024-01-01T15:00:00Z').getTime();

interface DateTestCase {
  value: number;
  format: DateFormatOptions;
  expected: string;
}

const TEST_CASES: DateTestCase[] = [
  // DateTime ISO format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-iso' } as DateFormatOptions,
    expected: '2024-01-01T12:30:45.000Z',
  },
  {
    value: TEST_TIMESTAMP_S,
    format: { unit: 'datetime-iso' } as DateFormatOptions,
    expected: '2024-01-01T12:30:45.000Z',
  },

  // DateTime US format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-us', locale: 'en-US' } as DateFormatOptions,
    expected: '01/01/2024, 07:30:45 AM',
  },

  // DateTime Local format (depends on locale)
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'en-US' } as DateFormatOptions,
    expected: '01/01/2024, 12:30:45',
  },

  // Date ISO format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '2024-01-01',
  },

  // Date US format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'date-us', locale: 'en-US' } as DateFormatOptions,
    expected: '01/01/2024',
  },

  // Date Local format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'date-local', locale: 'en-US' } as DateFormatOptions,
    expected: '01/01/2024',
  },

  // Time Local format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'time-local', locale: 'en-US' } as DateFormatOptions,
    expected: '12:30:45',
  },

  // Time ISO format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'time-iso' } as DateFormatOptions,
    expected: '12:30:45.000',
  },

  // Time US format
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'time-us', locale: 'en-US' } as DateFormatOptions,
    expected: '07:30:45 AM',
  },

  // Unix timestamp (seconds)
  {
    value: TEST_TIMESTAMP_S,
    format: { unit: 'unix-timestamp' } as DateFormatOptions,
    expected: '1704112245',
  },

  // Unix timestamp (milliseconds)
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'unix-timestamp-ms' } as DateFormatOptions,
    expected: '1704112245000',
  },

  // Relative time (past)
  {
    value: REFERENCE_TIME - 3600000, // 1 hour ago
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: '1 hour ago',
  },

  // Relative time (future)
  {
    value: REFERENCE_TIME + 3600000, // 1 hour from now
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'in 1 hour',
  },

  // Relative time (now)
  {
    value: REFERENCE_TIME,
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'now',
  },

  // Edge cases
  {
    value: 0, // Unix epoch
    format: { unit: 'datetime-iso' } as DateFormatOptions,
    expected: '1970-01-01T00:00:00.000Z',
  },

  {
    value: 946684800, // Year 2000 in seconds
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '2000-01-01',
  },

  {
    value: 946684800000, // Year 2000 in milliseconds
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '2000-01-01',
  },

  // Additional timezone tests for US formats
  {
    value: TEST_TIMESTAMP_MS, // Jan 1, 2024 12:30:45 UTC
    format: { unit: 'datetime-us' } as DateFormatOptions, // No locale specified - should use default
    expected: '01/01/2024, 07:30:45 AM', // EST is UTC-5 in January
  },
  {
    value: 1720182645000, // July 5, 2024 12:30:45 UTC (summer time)
    format: { unit: 'datetime-us', locale: 'en-US' } as DateFormatOptions,
    expected: '07/05/2024, 08:30:45 AM', // EDT is UTC-4 in July
  },
  {
    value: 1720182645000, // July 5, 2024 12:30:45 UTC
    format: { unit: 'date-us', locale: 'en-US' } as DateFormatOptions,
    expected: '07/05/2024',
  },
  {
    value: 1720182645000, // July 5, 2024 12:30:45 UTC
    format: { unit: 'time-us', locale: 'en-US' } as DateFormatOptions,
    expected: '08:30:45 AM', // EDT is UTC-4 in July
  },

  // Different locales tests
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'de-DE' } as DateFormatOptions,
    expected: '01.01.2024, 12:30:45',
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'date-local', locale: 'de-DE' } as DateFormatOptions,
    expected: '01.01.2024',
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'time-local', locale: 'de-DE' } as DateFormatOptions,
    expected: '12:30:45',
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'fr-FR' } as DateFormatOptions,
    expected: '01/01/2024 12:30:45',
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'date-local', locale: 'ja-JP' } as DateFormatOptions,
    expected: '2024/01/01',
  },

  // Timezone-specific tests
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'en-US', timeZone: 'UTC' } as DateFormatOptions,
    expected: '01/01/2024, 12:30:45',
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'en-US', timeZone: 'America/Los_Angeles' } as DateFormatOptions,
    expected: '01/01/2024, 04:30:45', // PST is UTC-8 in January
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'en-US', timeZone: 'Europe/London' } as DateFormatOptions,
    expected: '01/01/2024, 12:30:45', // GMT is UTC+0 in January
  },
  {
    value: TEST_TIMESTAMP_MS,
    format: { unit: 'datetime-local', locale: 'en-US', timeZone: 'Asia/Tokyo' } as DateFormatOptions,
    expected: '01/01/2024, 21:30:45', // JST is UTC+9
  },

  // Edge case timestamps
  {
    value: 253402300799, // Last second of year 9999 (seconds)
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '9999-12-31',
  },
  {
    value: 253402300799000, // Last second of year 9999 (milliseconds)
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '9999-12-31',
  },
  {
    value: -2208988800, // January 1, 1900 (seconds)
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '1900-01-01',
  },
  {
    value: -2208988800000, // January 1, 1900 (milliseconds)
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '1900-01-01',
  },

  // Leap year tests
  {
    value: 1709209845000, // February 29, 2024 12:30:45 UTC (leap year)
    format: { unit: 'date-iso' } as DateFormatOptions,
    expected: '2024-02-29',
  },
  {
    value: 1709209845000, // February 29, 2024 12:30:45 UTC
    format: { unit: 'datetime-iso' } as DateFormatOptions,
    expected: '2024-02-29T12:30:45.000Z',
  },

  // Different time zones during daylight saving transition
  {
    value: 1679229045000, // March 19, 2023 12:30:45 UTC (during DST transition period)
    format: { unit: 'datetime-us', locale: 'en-US' } as DateFormatOptions,
    expected: '03/19/2023, 08:30:45 AM', // EDT is UTC-4 in March
  },

  // More relative time test cases
  {
    value: REFERENCE_TIME - 2592000000, // 30 days ago (1 month)
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'last month',
  },
  {
    value: REFERENCE_TIME - 31536000000, // 365 days ago (1 year)
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'last year',
  },
  {
    value: REFERENCE_TIME + 2592000000, // 30 days from now (1 month)
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'next month',
  },
  {
    value: REFERENCE_TIME + 31536000000, // 365 days from now (1 year)
    format: { unit: 'relative-time', referenceTime: REFERENCE_TIME, locale: 'en-US' } as DateFormatOptions,
    expected: 'next year',
  },

  // Unix timestamp edge cases
  {
    value: 2147483647, // Max 32-bit signed integer (2038-01-19)
    format: { unit: 'unix-timestamp' } as DateFormatOptions,
    expected: '2147483647',
  },
  {
    value: 2147483647000, // Same as above but in milliseconds
    format: { unit: 'unix-timestamp' } as DateFormatOptions,
    expected: '2147483647', // Should convert ms to seconds
  },
  {
    value: 999999999, // September 9, 2001 (seconds)
    format: { unit: 'unix-timestamp-ms' } as DateFormatOptions,
    expected: '999999999000', // Should convert to milliseconds
  },
  {
    value: 999999999000, // Same but already in milliseconds
    format: { unit: 'unix-timestamp-ms' } as DateFormatOptions,
    expected: '999999999000',
  },

  // Fractional seconds handling
  {
    value: 1704112245123, // With milliseconds
    format: { unit: 'datetime-iso' } as DateFormatOptions,
    expected: '2024-01-01T12:30:45.123Z',
  },
  {
    value: 1704112245999, // With milliseconds at end of second
    format: { unit: 'time-iso' } as DateFormatOptions,
    expected: '12:30:45.999',
  },
];

describe('Date formatting', () => {
  describe('formatDate', () => {
    TEST_CASES.forEach(({ value, format, expected }) => {
      it(`should format ${value} with ${JSON.stringify(format)} as "${expected}"`, () => {
        const result = formatDate(value, format);
        expect(result).toEqual(expected);
      });
    });

    it('should handle default options', () => {
      const result = formatDate(TEST_TIMESTAMP_MS);
      // Should default to datetime-local with en-US locale
      expect(result).toContain('01/01/2024');
      expect(result).toContain('12:30:45');
    });

    it('should handle different locales', () => {
      const options: DateFormatOptions = { unit: 'date-local', locale: 'de-DE' };
      const result = formatDate(TEST_TIMESTAMP_MS, options);
      expect(result).toEqual('01.01.2024');
    });

    it('should handle timezone conversion', () => {
      const options: DateFormatOptions = {
        unit: 'datetime-local',
        locale: 'en-US',
        timeZone: 'America/New_York',
      };
      const result = formatDate(TEST_TIMESTAMP_MS, options);
      // In NYC, it should be 07:30:45 (UTC-5 in January)
      expect(result).toContain('07:30:45');
    });

    it('should handle millisecond vs second timestamps correctly', () => {
      // Very small timestamp - should be treated as seconds
      const smallTimestamp = 1000000; // ~1970-01-12
      const smallResult = formatDate(smallTimestamp, { unit: 'date-iso' });
      expect(smallResult).toEqual('1970-01-12');

      // Large timestamp - should be treated as milliseconds
      const largeTimestamp = 1704110445000;
      const largeResult = formatDate(largeTimestamp, { unit: 'date-iso' });
      expect(largeResult).toEqual('2024-01-01');
    });

    it('should handle relative time with different units', () => {
      const now = REFERENCE_TIME;

      // Test various time differences
      const testCases = [
        { diff: -86400000, expected: 'yesterday' }, // 1 day ago (using auto numeric)
        { diff: -3600000, expected: '1 hour ago' }, // 1 hour ago
        { diff: -60000, expected: '1 minute ago' }, // 1 minute ago
        { diff: -1000, expected: '1 second ago' }, // 1 second ago
        { diff: 0, expected: 'now' }, // now
        { diff: 1000, expected: 'in 1 second' }, // 1 second from now
        { diff: 60000, expected: 'in 1 minute' }, // 1 minute from now
        { diff: 3600000, expected: 'in 1 hour' }, // 1 hour from now
        { diff: 86400000, expected: 'tomorrow' }, // 1 day from now (using auto numeric)
      ];

      testCases.forEach(({ diff, expected }) => {
        const timestamp = now + diff;
        const result = formatDate(timestamp, {
          unit: 'relative-time',
          referenceTime: now,
          locale: 'en-US',
        });
        expect(result).toEqual(expected);
      });
    });

    it('should throw error for unknown unit', () => {
      expect(() => {
        // @ts-expect-error Testing invalid unit
        formatDate(TEST_TIMESTAMP_MS, { unit: 'invalid-unit' });
      }).toThrow('Unknown date unit: invalid-unit');
    });

    it('should handle all datetime formats with different locales', () => {
      const testLocales = ['en-US', 'de-DE', 'fr-FR', 'ja-JP', 'es-ES'];
      const formats: Array<{ unit: NonNullable<DateFormatOptions['unit']>; shouldWork: boolean }> = [
        { unit: 'datetime-local', shouldWork: true },
        { unit: 'date-local', shouldWork: true },
        { unit: 'time-local', shouldWork: true },
      ];

      testLocales.forEach((locale) => {
        formats.forEach(({ unit, shouldWork }) => {
          if (shouldWork) {
            expect(() => {
              const result = formatDate(TEST_TIMESTAMP_MS, { unit, locale });
              expect(typeof result).toBe('string');
              expect(result.length).toBeGreaterThan(0);
            }).not.toThrow();
          }
        });
      });
    });

    it('should handle daylight saving time transitions correctly', () => {
      // Spring forward: March 12, 2023 2:00 AM -> 3:00 AM EST -> EDT
      const springForward = 1678608000000; // March 12, 2023 07:00:00 UTC (2 AM EST before DST)
      const resultSpring = formatDate(springForward, {
        unit: 'datetime-us',
        locale: 'en-US',
      });
      expect(resultSpring).toContain('03/12/2023');
      expect(resultSpring).toContain('AM'); // Should be in AM

      // Fall back: November 5, 2023 2:00 AM -> 1:00 AM EDT -> EST
      const fallBack = 1699167600000; // November 5, 2023 06:00:00 UTC (1 AM EST after DST ends)
      const resultFall = formatDate(fallBack, {
        unit: 'datetime-us',
        locale: 'en-US',
      });
      expect(resultFall).toContain('11/05/2023');
      expect(resultFall).toContain('AM'); // Should be in AM
    });

    it('should handle ISO formats consistently regardless of timezone', () => {
      const testTimezones = ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

      testTimezones.forEach((timeZone) => {
        // ISO formats should always return UTC time regardless of timeZone setting
        const isoDateTime = formatDate(TEST_TIMESTAMP_MS, { unit: 'datetime-iso', timeZone });
        const isoDate = formatDate(TEST_TIMESTAMP_MS, { unit: 'date-iso', timeZone });
        const isoTime = formatDate(TEST_TIMESTAMP_MS, { unit: 'time-iso', timeZone });

        expect(isoDateTime).toBe('2024-01-01T12:30:45.000Z');
        expect(isoDate).toBe('2024-01-01');
        expect(isoTime).toBe('12:30:45.000');
      });
    });

    it('should handle very large and very small timestamps', () => {
      // Very large timestamp (far future)
      const farFuture = 32503680000000; // Year 3000
      const farFutureResult = formatDate(farFuture, { unit: 'date-iso' });
      expect(farFutureResult).toBe('3000-01-01');

      // Very small positive timestamp (early Unix era)
      const earlyUnix = 86400; // January 2, 1970 (seconds)
      const earlyUnixResult = formatDate(earlyUnix, { unit: 'date-iso' });
      expect(earlyUnixResult).toBe('1970-01-02');

      // Negative timestamp (before Unix epoch)
      const beforeEpoch = -86400; // December 31, 1969 (seconds)
      const beforeEpochResult = formatDate(beforeEpoch, { unit: 'date-iso' });
      expect(beforeEpochResult).toBe('1969-12-31');
    });

    it('should handle relative time with different locales', () => {
      const testCases = [
        { locale: 'en-US', diff: -3600000, expectedPattern: /hour ago/ },
        { locale: 'de-DE', diff: -3600000, expectedPattern: /Stunde/ },
        { locale: 'fr-FR', diff: -3600000, expectedPattern: /heure/ },
        { locale: 'es-ES', diff: -3600000, expectedPattern: /hora/ },
      ];

      testCases.forEach(({ locale, diff, expectedPattern }) => {
        const timestamp = REFERENCE_TIME + diff;
        const result = formatDate(timestamp, {
          unit: 'relative-time',
          referenceTime: REFERENCE_TIME,
          locale,
        });
        expect(result).toMatch(expectedPattern);
      });
    });

    it('should handle midnight and noon times correctly', () => {
      const midnight = 1704067200000; // January 1, 2024 00:00:00 UTC
      const noon = 1704110400000; // January 1, 2024 12:00:00 UTC

      // Midnight tests
      expect(formatDate(midnight, { unit: 'time-iso' })).toBe('00:00:00.000');
      expect(formatDate(midnight, { unit: 'time-local', locale: 'en-US' })).toBe('00:00:00');
      expect(formatDate(midnight, { unit: 'time-us', locale: 'en-US' })).toBe('07:00:00 PM'); // EST previous day

      // Noon tests
      expect(formatDate(noon, { unit: 'time-iso' })).toBe('12:00:00.000');
      expect(formatDate(noon, { unit: 'time-local', locale: 'en-US' })).toBe('12:00:00');
      expect(formatDate(noon, { unit: 'time-us', locale: 'en-US' })).toBe('07:00:00 AM'); // EST
    });

    it('should handle end of month dates correctly', () => {
      const endOfJanuary = 1706702400000; // January 31, 2024 12:00:00 UTC
      const endOfFebruary = 1709208000000; // February 29, 2024 12:00:00 UTC (leap year)

      expect(formatDate(endOfJanuary, { unit: 'date-iso' })).toBe('2024-01-31');
      expect(formatDate(endOfFebruary, { unit: 'date-iso' })).toBe('2024-02-29');

      // Test different locales handle these dates
      expect(formatDate(endOfJanuary, { unit: 'date-us' })).toBe('01/31/2024');
      expect(formatDate(endOfFebruary, { unit: 'date-us' })).toBe('02/29/2024');
    });

    it('should handle unix timestamp conversion edge cases', () => {
      // Test boundary between seconds and milliseconds detection
      const boundary = 10000000000; // Exactly at the threshold

      // Should be treated as seconds (converted to ms internally)
      const boundaryMinusOne = boundary - 1;
      const resultSeconds = formatDate(boundaryMinusOne, { unit: 'date-iso' });
      expect(resultSeconds).toBe('2286-11-20'); // Year 2286

      // Should be treated as milliseconds
      const boundaryPlusOne = boundary + 1;
      const resultMs = formatDate(boundaryPlusOne, { unit: 'date-iso' });
      expect(resultMs).toBe('1970-04-26'); // ~115 days from epoch
    });

    it('should maintain consistency between timestamp formats', () => {
      const testTimestamp = TEST_TIMESTAMP_S; // In seconds

      // Convert to different units and back - should be consistent
      const unixS = formatDate(testTimestamp, { unit: 'unix-timestamp' });
      const unixMs = formatDate(testTimestamp, { unit: 'unix-timestamp-ms' });

      expect(parseInt(unixS)).toBe(testTimestamp);
      expect(parseInt(unixMs)).toBe(testTimestamp * 1000);

      // Same timestamp in different input formats should produce same output
      const isoFromS = formatDate(testTimestamp, { unit: 'datetime-iso' });
      const isoFromMs = formatDate(testTimestamp * 1000, { unit: 'datetime-iso' });

      expect(isoFromS).toBe(isoFromMs);
    });
  });
});
