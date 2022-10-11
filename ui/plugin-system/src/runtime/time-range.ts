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

import { createContext, useContext } from 'react';
import { AbsoluteTimeRange, TimeRangeValue } from '@perses-dev/core';

export interface TimeRange {
  selectedTimeRange: TimeRangeValue; // includes relative time shortcuts
  setSelectedTimeRange: (value: TimeRangeValue) => void;
  timeRange: AbsoluteTimeRange; // resolved time
  setTimeRange: (value: TimeRangeValue) => void;
}

export const TimeRangeContext = createContext<TimeRange | undefined>(undefined);

function useTimeRangeContext() {
  const ctx = useContext(TimeRangeContext);
  if (ctx === undefined) {
    throw new Error('No TimeRangeContext found. Did you forget a Provider?');
  }
  return ctx;
}

/**
 * Gets the current TimeRange at runtime.
 */
export function useTimeRange() {
  const { timeRange, setTimeRange } = useTimeRangeContext();
  return { timeRange, setTimeRange };
}
