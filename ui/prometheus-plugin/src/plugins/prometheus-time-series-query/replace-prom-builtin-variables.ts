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

import { replaceVariable } from '@perses-dev/plugin-system';
import { formatDuration, msToPrometheusDuration } from '@perses-dev/core';

/*
 * Replace variable placeholders in a PromQL query

 * @param query The base promQL expression that contains variable placeholders
 * @param minStepMs the lower bound of the interval between data points, in milliseconds
 * @param intervalMs the actual interval between data points, in milliseconds
 * 
 * @returns a PromQL expression with variable placeholders replaced by their values
 */
export function replacePromBuiltinVariables(query: string, minStepMs: number, intervalMs: number): string {
  let updatedQuery = replaceVariable(query, '__interval_ms', intervalMs.toString());
  updatedQuery = replaceVariable(updatedQuery, '__interval', formatDuration(msToPrometheusDuration(intervalMs)));

  // The $__rate_interval variable is meant to be used with the rate() promQL function.
  // It is defined as max($__interval + Min step, 4 * Min step)
  const rateIntervalMs = Math.max(intervalMs + minStepMs, 4 * minStepMs);
  updatedQuery = replaceVariable(
    updatedQuery,
    '__rate_interval',
    formatDuration(msToPrometheusDuration(rateIntervalMs))
  );

  return updatedQuery;
}
