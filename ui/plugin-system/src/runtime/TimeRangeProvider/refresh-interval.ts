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

import { DurationString, parseDurationString } from '@perses-dev/core';
import { milliseconds } from 'date-fns';

/**
 * Utils function to transform a refresh interval in {@link DurationString} format into a number of ms.
 * @param refreshInterval
 */
export function getRefreshIntervalInMs(refreshInterval?: DurationString): number {
  if (refreshInterval !== undefined && refreshInterval !== null) {
    return milliseconds(parseDurationString(refreshInterval));
  }
  return 0;
}
