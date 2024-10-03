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
import { TableCellConfig, TableCellConfigs } from '@perses-dev/components/dist/Table/model/table-model';
import { CellSettings, ColumnSettings, TableOptions } from './table-model';

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

function generateCellConfig(value: unknown, settings: CellSettings[]): TableCellConfig | undefined {
  for (const setting of settings) {
    if (setting.condition.kind === 'Value' && setting.condition.spec?.value === String(value)) {
      return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
    }

    if (setting.condition.kind === 'Range' && !Number.isNaN(Number(value))) {
      const numericValue = Number(value);
      if (
        setting.condition.spec?.min &&
        setting.condition.spec?.max &&
        numericValue >= +setting.condition.spec?.min &&
        numericValue <= +setting.condition.spec?.max
      ) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }

      if (setting.condition.spec?.min && numericValue >= +setting.condition.spec?.min) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }

      if (setting.condition.spec?.max && numericValue <= +setting.condition.spec?.max) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
    }

    if (setting.condition.kind === 'Regex' && setting.condition.spec?.regex) {
      const regex = new RegExp(setting.condition.spec?.regex);
      if (regex.test(String(value))) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
    }

    if (setting.condition.kind === 'Misc' && setting.condition.spec?.value) {
      if (setting.condition.spec?.value === 'empty' && value === '') {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
      if (setting.condition.spec?.value === 'null' && (value === null || value === undefined)) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
      if (setting.condition.spec?.value === 'NaN' && Number.isNaN(value)) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
      if (setting.condition.spec?.value === 'true' && value === true) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
      if (setting.condition.spec?.value === 'false' && value === false) {
        return { text: setting.text, textColor: setting.textColor, backgroundColor: setting.backgroundColor };
      }
    }
  }
  return undefined;
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

  // Generate cell settings that will be used by the table to render cells (text color, background color, ...)
  const cellConfigs: TableCellConfigs = useMemo(() => {
    // If there is no cell settings, return an empty array
    if (spec.cellSettings === undefined) {
      return {};
    }

    const result: TableCellConfigs = {};

    let index = 0;
    for (const row of data) {
      // Transforming key to object to extend the row with undefined values if the key is not present
      // for checking the cell config "Misc" condition with "null"
      const keysAsObj = keys.reduce(
        (acc, key) => {
          acc[key] = undefined;
          return acc;
        },
        {} as Record<string, undefined>
      );

      const extendRow = {
        ...keysAsObj,
        ...row,
      };

      for (const [key, value] of Object.entries(extendRow)) {
        const cellConfig = generateCellConfig(value, spec.cellSettings ?? []);
        if (cellConfig) {
          result[`${index}_${key}`] = cellConfig;
        }
      }
      index++;
    }

    return result;
  }, [data, spec.cellSettings]);

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
      cellConfigs={cellConfigs}
      sorting={sorting}
      height={contentDimensions.height}
      width={contentDimensions.width}
      density={spec.density}
      onSortingChange={handleSortingChange}
    />
  );
}
