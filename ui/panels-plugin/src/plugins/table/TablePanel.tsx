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

import { PanelProps, useDataQueries } from '@perses-dev/plugin-system';
import { LoadingOverlay, Table, TableColumnConfig } from '@perses-dev/components';
import { useMemo } from 'react';
import { TableOptions } from './table-model';

export type TableProps = PanelProps<TableOptions>;

export function TablePanel(props: TableProps) {
  const { contentDimensions } = props;
  const { isFetching, isLoading, queryResults } = useDataQueries('TimeSeriesQuery');

  const data = useMemo(() => {
    return queryResults
      .flatMap((d) => d.data)
      .flatMap((d) => d?.series || [])
      .map((ts) => ts.labels ?? {});
  }, [queryResults]);

  const keys = useMemo(() => {
    const result: string[] = [];

    for (const labels of data) {
      for (const key of Object.keys(labels)) {
        if (!result.includes(key)) {
          result.push(key);
        }
      }
    }

    return result;
  }, [data]);

  const columns = useMemo(() => {
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
