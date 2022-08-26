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

import { isBefore, isValid, format } from 'date-fns';
import { AbsoluteTimeRange } from '@perses-dev/core';

/*
 * Date validation and check if end is after start
 */
export function validateDateRange(startDate: Date, endDate: Date) {
  // TODO: display error as helperText
  if (!isValid(startDate) || !isValid(endDate)) {
    console.error('Invalid Date');
    return false;
  }
  if (!isBefore(startDate, endDate)) {
    console.error('End Time is before Start Time');
    return false;
  }
  return true;
}

/**
 * Format start and end time based on provided date format
 */
export function formatAbsoluteRange(timeRange: AbsoluteTimeRange, dateFormat: string) {
  const formattedStart = format(timeRange.start, dateFormat);
  const formattedEnd = format(timeRange.end, dateFormat);
  return `${formattedStart} - ${formattedEnd}`;
}
