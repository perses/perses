// Copyright 2024 The Perses Authors
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

import { formatWithTimeZone } from '../utils';

// https://echarts.apache.org/en/option.html#xAxis.axisLabel.formatter
export function getFormattedStatusHistoryAxisLabel(rangeMs: number, timezone: string) {
  return function (value: number) {
    const dayMs = 86400000;
    const monthMs = 2629440000;
    const yearMs = 31536000000;

    const timeStamp = new Date(Number(value));

    // more than 5 years
    if (rangeMs > yearMs * 5) {
      return formatWithTimeZone(timeStamp, 'yyy', timezone);
    }

    // more than 2 years
    if (rangeMs > yearMs * 2) {
      return formatWithTimeZone(timeStamp, 'MMM yyy', timezone);
    }

    // between 5 days to 6 months
    if (rangeMs > dayMs * 10 && rangeMs < monthMs * 6) {
      return formatWithTimeZone(timeStamp, 'dd.MM', timezone); // 12-01
    }

    // between 2 and 10 days
    if (rangeMs > dayMs * 2 && rangeMs <= dayMs * 10) {
      return formatWithTimeZone(timeStamp, 'dd.MM HH:mm', timezone); // 12-01; // 12-01 12:30
    }

    return formatWithTimeZone(timeStamp, 'HH:mm', timezone);
  };
}
