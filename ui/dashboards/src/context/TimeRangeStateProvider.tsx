// Copyright 2021 The Perses Authors
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

import { useState, useMemo } from 'react';
import { AbsoluteTimeRange, RelativeTimeRange, toAbsoluteTimeRange, TimeRangeContext } from '@perses-dev/core';

export interface TimeRangeProviderProps {
  initialValue: AbsoluteTimeRange | RelativeTimeRange;
  children?: React.ReactNode;
}

/**
 * Provider implementation that supplies the TimeRangeState at runtime.
 */
export function TimeRangeStateProvider(props: TimeRangeProviderProps) {
  const { initialValue, children } = props;

  // Use initialValue to populate state (TODO: Will prob need to expose "setter" API eventually)
  const [timeRange] = useState(() => {
    if ('pastDuration' in initialValue) {
      return toAbsoluteTimeRange(initialValue);
    }
    return initialValue;
  });

  const ctx = useMemo(() => ({ timeRange }), [timeRange]);

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
