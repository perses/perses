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
    case '-Inf':
      value = Number.NEGATIVE_INFINITY;
    default:
      value = parseFloat(sampleValue);
  }
  return value;
}
