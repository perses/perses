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

import {
  DurationString,
  parseDurationString,
  useMemoized,
  usePanelState,
  useDashboardTimeRange,
} from '@perses-dev/core';
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
  const { start, end } = useDashboardTimeRange();

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
export function usePanelRangeStep(timeRange: PrometheusTimeRange, minStepSeconds = 15, resolution = 1) {
  // Keep track of the latest panel width in a ref
  const { contentDimensions } = usePanelState();
  const panelWidth = useRef(contentDimensions?.width);
  panelWidth.current = contentDimensions?.width;

  // Whenever the time range changes, recalculate the appropriate step
  return useMemoized(() => {
    const queryRangeSeconds = timeRange.end - timeRange.start;

    // TODO: Should we try to suggest more "rounded" step values based around
    // time increments that make sense (e.g. 15s, 30s, 1m, 5m, etc.)
    let suggestedStep = 0;
    if (panelWidth.current !== undefined) {
      suggestedStep = Math.floor(queryRangeSeconds / panelWidth.current);
    }

    let safeStep = queryRangeSeconds / MAX_PROM_DATA_POINTS;
    if (safeStep > 1) {
      safeStep = Math.ceil(safeStep);
    }

    return Math.max(suggestedStep * resolution, minStepSeconds, safeStep);
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
