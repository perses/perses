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

import { formatInTimeZone } from 'date-fns-tz';
import { format } from 'date-fns';

export function dateFormatOptionsWithTimeZone(dateFormatOptions: Intl.DateTimeFormatOptions, timeZone?: string) {
  /*
   * if timeZone is provided, and is not local|browser,
   * then set timeZone option (recognize UTC regardless of uppercase/lowercase)
   * otherwise, default to browser timeZone setting
   */
  if (timeZone) {
    const lowerTimeZone = timeZone.toLowerCase();
    if (lowerTimeZone !== 'local' && lowerTimeZone !== 'browser') {
      return {
        ...dateFormatOptions,
        timeZone: lowerTimeZone === 'utc' ? 'UTC' : timeZone,
      };
    }
  }
  return dateFormatOptions;
}

export function formatWithTimeZone(date: Date, formatString: string, timeZone?: string) {
  /*
   * if timeZone is provided, and is not local|browser,
   * then format using timeZone option (recognize UTC regardless of uppercase/lowercase)
   * otherwise, format without timeZone option, defaulting to browser timeZone setting
   */
  const lowerTimeZone = timeZone?.toLowerCase();
  if (!timeZone || lowerTimeZone === 'local' || lowerTimeZone === 'browser') {
    return format(date, formatString);
  } else {
    return formatInTimeZone(date, lowerTimeZone === 'utc' ? 'UTC' : timeZone, formatString);
  }
}
