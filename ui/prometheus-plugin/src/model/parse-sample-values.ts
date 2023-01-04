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

import { ValueTuple } from './api-types';

/**
 * ValueTuple from the Prom server, parsed into ms and floating point number
 */
export type ParsedValueTuple = [unixTimeMs: number, value: number];

/**
 * Parse a ValueTuple from a PromServer response into the a millisecond-based
 * unix time and a numeric sample value.
 */
export function parseValueTuple(data: ValueTuple): ParsedValueTuple {
  const [unixTimeSeconds, sampleValue] = data;

  // Prom returns unix time in seconds, so convert to ms
  return [unixTimeSeconds * 1000, parseSampleValue(sampleValue)];
}

/**
 * Parses a string sample value from Prometheus, usually included as the
 * second member of a ValueTuple.
 */
export function parseSampleValue(sampleValue: ValueTuple[1]): number {
  // Account for Prometheus' representation of +/- infinity, otherwise just
  // parse the sample value as a float
  let value: number;
  switch (sampleValue) {
    case '+Inf':
      value = Number.POSITIVE_INFINITY;
      break;
    case '-Inf':
      value = Number.NEGATIVE_INFINITY;
      break;
    default:
      value = parseFloat(sampleValue);
  }
  return value;
}
