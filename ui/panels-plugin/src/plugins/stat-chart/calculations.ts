import { findLast, mean as _mean } from 'lodash-es';

export const CalculationsMap = {
  First: first,
  Last: last,
  LastNumber: lastNumber,
  Mean: mean,
};

export type CalculationType = keyof typeof CalculationsMap;

function first(values: number[]): number | undefined {
  return values[0];
}

function last(values: number[]): number | undefined {
  if (values.length <= 0) return undefined;
  return values[values.length - 1];
}

function lastNumber(values: number[]): number | undefined {
  return findLast(values, (val) => isNaN(val) === false);
}

function mean(values: number[]): number | undefined {
  if (values.length <= 0) return undefined;
  return _mean(values);
}
