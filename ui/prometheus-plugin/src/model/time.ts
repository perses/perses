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

import { AbsoluteTimeRange, DurationString, parseDurationString } from '@perses-dev/core';
import { milliseconds, getUnixTime } from 'date-fns';
import { UnixTimestampSeconds } from './api-types';

export interface PrometheusTimeRange {
  start: UnixTimestampSeconds;
  end: UnixTimestampSeconds;
}

/**
 * Converts an AbsoluteTimeRange to Prometheus time in Unix time (i.e. in seconds).
 */
export function getPrometheusTimeRange(timeRange: AbsoluteTimeRange): { start: number; end: number } {
  const { start, end } = timeRange;
  return {
    start: Math.ceil(getUnixTime(start)),
    end: Math.ceil(getUnixTime(end)),
  };
}

// Max data points to allow returning from a Prom Query, used to calculate a
// "safe" step for a range query
const MAX_PROM_DATA_POINTS = 10000;

/**
 * Gets the step to use for a Prom range query. Tries to take into account a suggested step size (probably based on the
 * width of a visualization where the data will be graphed), any minimum step/resolution set by the user, and a "safe"
 * step based on the max data points we want to allow returning from a Prom query.
 */
export function getRangeStep(
  timeRange: PrometheusTimeRange,
  minStepSeconds = 15,
  resolution = 1,
  suggestedStepMs = 0
): number {
  const suggestedStepSeconds = suggestedStepMs / 1000;
  const queryRangeSeconds = timeRange.end - timeRange.start;

  let safeStep = queryRangeSeconds / MAX_PROM_DATA_POINTS;
  if (safeStep > 1) {
    safeStep = Math.ceil(safeStep);
  }

  return Math.max(suggestedStepSeconds * resolution, minStepSeconds, safeStep);
}

/**
 * Converts a DurationString to seconds, rounding down.
 */
export function getDurationStringSeconds(durationString?: DurationString): number | undefined {
  if (!durationString) return undefined;

  const duration = parseDurationString(durationString);
  const ms = milliseconds(duration);
  return Math.floor(ms / 1000);
}
