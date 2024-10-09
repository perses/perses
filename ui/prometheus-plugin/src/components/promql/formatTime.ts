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

// Forked from https://github.com/prometheus/prometheus/blob/65f610353919b1c7b42d3776c3a95b68046a6bba/web/ui/mantine-ui/src/lib/formatTime.ts

// Format a duration in milliseconds into a Prometheus duration string like "1d2h3m4s".
export const formatPrometheusDuration = (d: number): string => {
  return formatDuration(d);
};

const formatDuration = (d: number, componentSeparator?: string, showFractionalSeconds?: boolean): string => {
  if (d === 0) {
    return '0s';
  }

  const sign = d < 0 ? '-' : '';
  let ms = Math.abs(d);
  const r: string[] = [];

  for (const { unit, mult, exact } of [
    // Only format years and weeks if the remainder is zero, as it is often
    // easier to read 90d than 12w6d.
    { unit: 'y', mult: 1000 * 60 * 60 * 24 * 365, exact: true },
    { unit: 'w', mult: 1000 * 60 * 60 * 24 * 7, exact: true },
    { unit: 'd', mult: 1000 * 60 * 60 * 24, exact: false },
    { unit: 'h', mult: 1000 * 60 * 60, exact: false },
    { unit: 'm', mult: 1000 * 60, exact: false },
    { unit: 's', mult: 1000, exact: false },
    { unit: 'ms', mult: 1, exact: false },
  ]) {
    if (exact && ms % mult !== 0) {
      continue;
    }
    const v = Math.floor(ms / mult);
    if (v > 0) {
      ms -= v * mult;
      if (showFractionalSeconds && unit === 's' && ms > 0) {
        // Show "2.34s" instead of "2s 340ms".
        r.push(`${parseFloat((v + ms / 1000).toFixed(3))}s`);
        break;
      } else {
        r.push(`${v}${unit}`);
      }
    }
    if (r.length === 0 && unit === 'ms') {
      r.push(`${Math.round(ms)}ms`);
    }
  }

  return sign + r.join(componentSeparator || '');
};
