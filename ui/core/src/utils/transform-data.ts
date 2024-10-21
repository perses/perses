import { Transform } from '@perses-dev/core';
import { useMemo } from 'react';

export function applyJoinTransform(
  data: Array<Record<string, unknown>>,
  transform: Transform
): Array<Record<string, unknown>> {
  const column: string = transform.spec.plugin.spec.column as string;
  const entriesHashed: { [key: string]: Record<string, unknown> } = {};

  for (const entry of data) {
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

export function applyMergeIndexedColumnsTransform(data: Array<Record<string, unknown>>, transform: Transform) {
  const result: Array<Record<string, unknown>> = [];
  const column: string = transform.spec.plugin.spec.column as string;

  for (const entry of data) {
    const indexedColumns = Object.keys(entry).filter((k) =>
      new RegExp('^(' + column + ' #\\d+)|(' + column + ')$').test(k)
    );
    const indexedColumnValues: Record<string, unknown> = {};

    for (const indexedColumn of indexedColumns) {
      indexedColumnValues[indexedColumn] = entry[indexedColumn];
      delete entry[indexedColumn];
    }

    for (const indexedColumn of indexedColumns) {
      result.push({ ...entry, [column]: indexedColumnValues[indexedColumn] });
    }

    if (indexedColumns.length === 0) {
      result.push(entry);
    }
  }

  return result;
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
    // TODO: switch
    if (transform.spec.disabled) continue;
    if (transform.spec.plugin.kind === 'JoinByColumnValue') {
      result = applyJoinTransform(result, transform);
    }
    if (transform.spec.plugin.kind === 'MergeIndexedColumns') {
      result = applyMergeIndexedColumnsTransform(result, transform);
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
