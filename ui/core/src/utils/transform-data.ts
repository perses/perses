import { Transform } from '@perses-dev/core';
import { useMemo } from 'react';

export function applyJoinTransform(
  data: Array<Record<string, unknown>>,
  transform: Transform
): Array<Record<string, unknown>> {
  const keys: string[] = transform.spec.plugin.spec.keys as string[]; // TODO: better type handling
  const key: string = keys[0]!; // TODO: handle multiple keys

  const entriesHashed: { [key: string]: Record<string, unknown> } = {};

  for (const entry of data) {
    if (Object.keys(entry).includes(key)) {
      // TODO: handle multiple keys
      const hash = String(entry[key]);
      const entryHashed = entriesHashed[hash];
      if (entryHashed) {
        entriesHashed[hash] = { ...entryHashed, ...entry }; // TODO: handle conflicts INNER/OUTER JOIN
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
