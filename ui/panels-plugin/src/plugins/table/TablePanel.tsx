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
import { useMemo } from 'react';
import { TimeSeries, TimeSeriesData } from '@perses-dev/core';
import { TableOptions } from './table-model';

export type TableProps = PanelProps<TableOptions>;

export function TablePanel(props: TableProps) {
  const { contentDimensions } = props;
  // TODO: handle other query types
  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');

  const data: Array<Record<string, unknown>> = useMemo(() => {
    return queryResults
      .flatMap((d: QueryData<TimeSeriesData>) => d.data)
      .flatMap((d: TimeSeriesData | undefined) => d?.series || [])
      .map((ts: TimeSeries) => {
        if (ts.values[0] === undefined) {
          return { ...ts.labels };
        }
        return { timestamp: ts.values[0][0], value: ts.values[0][1], ...ts.labels };
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
      columns.push({
        accessorKey: key,
        header: key,
      });
    }
    return columns;
  }, [keys]);

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  if (contentDimensions === undefined) {
    return null;
  }

  return <Table data={data} columns={columns} height={contentDimensions.height} width={contentDimensions.width} />;
}
