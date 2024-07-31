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

import { PanelProps, QueryData, useDataQueries } from '@perses-dev/plugin-system';
import { LoadingOverlay, Table, TableColumnConfig } from '@perses-dev/components';
import { useMemo, useState } from 'react';
import { TimeSeries, TimeSeriesData } from '@perses-dev/core';
import { SortingState } from '@tanstack/react-table';
import { ColumnSettings, TableOptions } from './table-model';

/*
 * Generate column config from column definitions, if a column has multiple definitions, the first one will be used.
 * If column is hidden, return undefined.
 * If column do not have a definition, return a default column config.
 */
function generateColumnConfig(name: string, columnSettings: ColumnSettings[]): TableColumnConfig<unknown> | undefined {
  for (const column of columnSettings) {
    if (column.name === name) {
      if (column.hide) {
        return undefined;
      }

      return {
        accessorKey: name,
        header: column.header ?? name,
        headerDescription: column.headerDescription,
        cellDescription: column.cellDescription ? (_) => `${column.cellDescription}` : undefined, // TODO: variable rendering + cell value
        enableSorting: column.enableSorting,
        width: column.width,
        align: column.align,
      };
    }
  }

  return {
    accessorKey: name,
    header: name,
  };
}

export type TableProps = PanelProps<TableOptions>;

export function TablePanel({ contentDimensions, spec }: TableProps) {
  // TODO: handle other query types
  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');

  const [sorting, setSorting] = useState<SortingState>([]);

  const data: Array<Record<string, unknown>> = useMemo(() => {
    return queryResults
      .flatMap((d: QueryData<TimeSeriesData>) => d.data)
      .flatMap((d: TimeSeriesData | undefined) => d?.series || [])
      .map((ts: TimeSeries) => {
        if (ts.values[0] === undefined) {
          return { ...ts.labels };
        }
        return { timestamp: ts.values[0][0], value: ts.values[0][1], ...ts.labels }; // TODO: support multiple values and timestamps
      });
  }, [queryResults]);

  const keys: string[] = useMemo(() => {
    const result: string[] = [];

    for (const entry of data) {
      for (const key of Object.keys(entry)) {
        if (!result.includes(key)) {
          result.push(key);
        }
      }
    }

    return result;
  }, [data]);

  const columns: Array<TableColumnConfig<unknown>> = useMemo(() => {
    const columns: Array<TableColumnConfig<unknown>> = [];
    for (const key of keys) {
      const columnConfig = generateColumnConfig(key, spec.columnSettings ?? []);
      if (columnConfig !== undefined) {
        columns.push(columnConfig);
      }
    }
    return columns;
  }, [keys, spec.columnSettings]);

  function handleSortingChange(sorting: SortingState) {
    setSorting(sorting);
  }

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  if (contentDimensions === undefined) {
    return null;
  }

  return (
    <Table
      data={data}
      columns={columns}
      sorting={sorting}
      height={contentDimensions.height}
      width={contentDimensions.width}
      density={spec.density}
      onSortingChange={handleSortingChange}
    />
  );
}
