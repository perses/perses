import { Transform } from '@perses-dev/core';
import { useMemo } from 'react';

export function applyJoinTransform(
  data: Array<Record<string, unknown>>,
  transform: Transform
): Array<Record<string, unknown>> {
  const column: string = transform.spec.plugin.spec.column as string;
  const entriesHashed: { [key: string]: Record<string, unknown> } = {};

  for (const entry of data) {
    const match = Object.keys(entry).find((k) => new RegExp('^' + column + ' #\\d+$').test(k));
    if (match) {
      const value = entry[match];
      delete entry[match];
      entry[column] = value;
    }

    if (Object.keys(entry).includes(column)) {
      const hash = String(entry[column]);
      const entryHashed = entriesHashed[hash];

      if (entryHashed) {
        entriesHashed[hash] = { ...entryHashed, ...entry };
      } else {
        entriesHashed[hash] = { ...entry };
      }
    }
  }
  return Object.values(entriesHashed);
}

/*
 * Transforms query data with the given transforms
 */
export function transformData(
  data: Array<Record<string, unknown>>,
  transforms: Transform[]
): Array<Record<string, unknown>> {
  let result: Array<Record<string, unknown>> = data;

  // Apply transforms by their orders
  for (const transform of transforms ?? []) {
    if (transform.spec.disabled) continue;
    if (transform.spec.plugin.kind === 'Join') {
      result = applyJoinTransform(result, transform);
    }
  }
  return result;
}

export function useTransformData(
  data: Array<Record<string, unknown>>,
  transforms: Transform[]
): Array<Record<string, unknown>> {
  return useMemo(() => transformData(data, transforms), [data, transforms]);
}
