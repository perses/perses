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

import { DurationString, parseDurationString, useMemoized, useTimeRange } from '@perses-dev/core';
import { milliseconds, getUnixTime } from 'date-fns';
import { useRef } from 'react';
import { UnixTimestampSeconds } from './api-types';

export interface PrometheusTimeRange {
  start: UnixTimestampSeconds;
  end: UnixTimestampSeconds;
}

/**
 * Get the time range for the current dashboard, converted to Prometheus time.
 */
export function useDashboardPrometheusTimeRange() {
  const {
    timeRange: { start, end },
  } = useTimeRange();

  // Only recalculate the time range if the value on the dashboard changes
  return useMemoized(() => {
    return {
      start: Math.ceil(getUnixTime(start)),
      end: Math.ceil(getUnixTime(end)),
    };
  }, [start, end]);
}

// Max data points to allow returning from a Prom Query, used to calculate a
// "safe" step for a range query
const MAX_PROM_DATA_POINTS = 10000;

/**
 * Gets the step to use for a Panel range query. Tries to take into account
 * the width of the panel, any minimum step/resolution set by the user, and
 * a "safe" step based on the max data points we want to allow returning from
 * a Prom query.
 */
export function usePanelRangeStep(
  timeRange: PrometheusTimeRange,
  minStepSeconds = 15,
  resolution = 1,
  suggestedStepMs = 0
) {
  // Keep track of the latest suggested step so we don't re-run the query if it changes
  const latestSuggestedStep = useRef(suggestedStepMs * 1000);
  latestSuggestedStep.current = suggestedStepMs * 1000;

  // Whenever the time range changes, recalculate the appropriate step
  return useMemoized(() => {
    const queryRangeSeconds = timeRange.end - timeRange.start;

    let safeStep = queryRangeSeconds / MAX_PROM_DATA_POINTS;
    if (safeStep > 1) {
      safeStep = Math.ceil(safeStep);
    }

    return Math.max(latestSuggestedStep.current * resolution, minStepSeconds, safeStep);
  }, [timeRange, minStepSeconds, resolution]);
}

/**
 * Converts a DurationString to seconds, rounding down.
 */
export function getDurationStringSeconds(durationString?: DurationString) {
  if (durationString === undefined) return undefined;

  const duration = parseDurationString(durationString);
  const ms = milliseconds(duration);
  return Math.floor(ms / 1000);
}
