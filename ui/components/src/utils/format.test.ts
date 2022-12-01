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
import { dateFormatOptionsWithTimeZone, formatWithTimeZone } from './format';

const DATE = new Date(168523200000);

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
};

describe('formatWithTimeZone', () => {
  it('should format in Los Angeles timezone', () => {
    expect(formatWithTimeZone(DATE, 'yyyy-MM-dd HH:mm:ss', 'America/Los_Angeles')).toBe('1975-05-05 05:00:00');
  });
  it('should format in UTC timezone', () => {
    expect(formatWithTimeZone(DATE, 'yyyy-MM-dd HH:mm:ss', 'UTC')).toBe('1975-05-05 12:00:00');
    expect(formatWithTimeZone(DATE, 'yyyy-MM-dd HH:mm:ss', 'utc')).toBe('1975-05-05 12:00:00');
  });
});

describe('dateFormatOptionsWithTimeZone', () => {
  it('should format in Los Angeles timezone', () => {
    const dateFormatOptions = dateFormatOptionsWithTimeZone(DATE_FORMAT_OPTIONS, 'America/Los_Angeles');
    expect(new Intl.DateTimeFormat(undefined, dateFormatOptions).format(DATE)).toBe('05:00');
  });
  it('should format in UTC timezone', () => {
    const dateFormatOptions = dateFormatOptionsWithTimeZone(DATE_FORMAT_OPTIONS, 'utc');
    expect(new Intl.DateTimeFormat(undefined, dateFormatOptions).format(DATE)).toBe('12:00');
  });
  it('should use browser local timezone', () => {
    expect(dateFormatOptionsWithTimeZone(DATE_FORMAT_OPTIONS, 'browser').timeZone).toBeUndefined();
    expect(dateFormatOptionsWithTimeZone(DATE_FORMAT_OPTIONS, 'local').timeZone).toBeUndefined();
    expect(dateFormatOptionsWithTimeZone(DATE_FORMAT_OPTIONS).timeZone).toBeUndefined();
  });
});
