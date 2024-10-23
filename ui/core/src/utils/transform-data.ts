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

import {
  JoinByColumnValueTransformSpec,
  MergeColumnsTransformSpec,
  MergeIndexedColumnsTransformSpec,
  Transform,
} from '@perses-dev/core';
import { useMemo } from 'react';

// export function applyJoinTransform(
//   data: Array<Record<string, unknown>>,
//   transform: Transform<JoinByColumnValueTransformSpec>
// ): Array<Record<string, unknown>> {
//   // If column is undefined or empty, return data as is
//   if (!transform.spec.plugin.spec.column) {
//     return data;
//   }
//
//   const column: string = transform.spec.plugin.spec.column;
//   const entriesHashed: { [key: string]: Record<string, unknown> } = {};
//
//   for (const entry of data) {
//     if (Object.keys(entry).includes(column)) {
//       const hash = String(entry[column]);
//       const entryHashed = entriesHashed[hash];
//
//       if (entryHashed) {
//         entriesHashed[hash] = { ...entryHashed, ...entry };
//       } else {
//         entriesHashed[hash] = { ...entry };
//       }
//     }
//   }
//   return Object.values(entriesHashed);
// }

export function applyJoinTransform(
  data: Array<Record<string, unknown>>,
  columns: string[]
): Array<Record<string, unknown>> {
  // If column is undefined or empty, return data as is
  if (columns?.length === 0) {
    return data;
  }

  const rowHashed: { [key: string]: Record<string, unknown> } = {};

  for (const row of data) {
    const rowHash = Object.keys(row)
      .filter((k) => columns.includes(k))
      .map((k) => row[k])
      .join('|');

    const rowHashedValue = rowHashed[rowHash];
    if (rowHashedValue) {
      rowHashed[rowHash] = { ...rowHashedValue, ...row };
    } else {
      rowHashed[rowHash] = { ...row };
    }
  }
  return Object.values(rowHashed);
}

export function applyMergeColumnsTransform(
  data: Array<Record<string, unknown>>,
  selectedColumns: string[],
  outputName: string
) {
  const result: Array<Record<string, unknown>> = [];

  for (const row of data) {
    const columns = Object.keys(row).filter((k) => selectedColumns.includes(k));

    const selectedColumnValues: Record<string, unknown> = {};

    for (const column of columns) {
      selectedColumnValues[column] = row[column];
      delete row[column];
    }

    for (const column of columns) {
      result.push({ ...row, [outputName]: selectedColumnValues[column] });
    }

    if (columns.length === 0) {
      result.push(row);
    }
  }

  return result;
}

export function applyMergeIndexedColumnsTransform(data: Array<Record<string, unknown>>, column: string) {
  const result: Array<Record<string, unknown>> = [];

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

export function applyMergeSeriesTransform(data: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  let result: Array<Record<string, unknown>> = [...data];

  const labelColumns = Array.from(
    new Set(
      data
        .flatMap(Object.keys)
        .map((label) => label.replace(/ #\d+/, ''))
        .filter((label) => label !== 'value')
    )
  );

  for (const label of labelColumns) {
    result = applyMergeIndexedColumnsTransform(result, label);
  }

  result = applyJoinTransform(result, labelColumns);

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
    if (transform.spec.disabled) continue;

    switch (transform.spec.plugin.kind) {
      case 'JoinByColumnValue': {
        const spec = (transform as unknown as Transform<JoinByColumnValueTransformSpec>).spec.plugin.spec;
        if (spec.columns && spec.columns.length > 0) {
          result = applyJoinTransform(result, spec.columns);
        }
        break;
      }
      case 'MergeIndexedColumns': {
        const spec = (transform as unknown as Transform<MergeIndexedColumnsTransformSpec>).spec.plugin.spec;
        if (spec.column) {
          result = applyMergeIndexedColumnsTransform(result, spec.column);
        }
        break;
      }
      case 'MergeColumns': {
        const spec = (transform as unknown as Transform<MergeColumnsTransformSpec>).spec.plugin.spec;
        if (spec.columns && spec.columns.length > 0 && spec.name) {
          result = applyMergeColumnsTransform(result, spec.columns, spec.name);
        }
        break;
      }
      case 'MergeSeries': {
        result = applyMergeSeriesTransform(result);
        break;
      }
    }
  }

  // Ordering data column alphabetically
  result = result.map((row) => {
    return Object.keys(row)
      .sort()
      .reduce((obj, key) => {
        // @ts-expect-error: todo
        obj[key] = row[key];
        return obj;
      }, {});
  });
  return result;
}

export function useTransformData(
  data: Array<Record<string, unknown>>,
  transforms: Transform[]
): Array<Record<string, unknown>> {
  return useMemo(() => transformData(data, transforms), [data, transforms]);
}
