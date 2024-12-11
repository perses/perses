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

import { Definition, Transform } from '@perses-dev/core';
import { TableDensity } from '@perses-dev/components';

export interface ColumnSettings {
  name: string;

  // Text to display in the header for the column.
  header?: string;
  /**
   * Text to display when hovering over the header text. This can be useful for
   * providing additional information about the column when you want to keep the
   * header text relatively short to manage the column width.
   */
  headerDescription?: string;
  /**
   * Text to display when hovering over a cell. This can be useful for
   * providing additional information about the column when the content is
   * ellipsized to fit in the space.
   */
  cellDescription?: string;
  // Alignment of the content in the cell.
  align?: 'left' | 'center' | 'right';

  // When `true`, the column will be sortable.
  enableSorting?: boolean;

  // Default sort order for the column.
  sort?: 'asc' | 'desc';

  /**
   * Width of the column when rendered in a table. It should be a number in pixels
   * or "auto" to allow the table to automatically adjust the width to fill
   * space.
   */
  width?: number | 'auto';
  // When `true`, the column will not be displayed.
  hide?: boolean;
}

export interface ValueCondition {
  kind: 'Value';
  spec: {
    value: string;
  };
}

export interface RangeCondition {
  kind: 'Range';
  spec: {
    min?: number;
    max?: number;
  };
}

export interface RegexCondition {
  kind: 'Regex';
  spec: {
    expr: string;
  };
}

export interface MiscCondition {
  kind: 'Misc';
  spec: {
    value: 'empty' | 'null' | 'NaN' | 'true' | 'false';
  };
}

export type Condition = ValueCondition | RangeCondition | RegexCondition | MiscCondition;

export interface CellSettings {
  condition: Condition;
  text?: string;
  textColor?: `#${string}`;
  backgroundColor?: `#${string}`;
}

/**
 * The schema for a Table panel.
 */
export interface TableDefinition extends Definition<TableOptions> {
  kind: 'Table';
}

/**
 * The Options object type supported by the Table panel plugin.
 */
export interface TableOptions {
  // Change row height.
  density?: TableDensity;
  // When true, the table will try to automatically adjust the width of columns to fit without overflowing.
  // Only for column without custom width specified in columnSettings.
  defaultColumnWidth?: 'auto' | number;
  // Customize column display and order them by their index in the array.
  columnSettings?: ColumnSettings[];
  // Customize cell display based on their value.
  cellSettings?: CellSettings[];
  // Apply transforms to the data before rendering the table.
  transforms?: Transform[];
}

/**
 * Creates the initial/empty options for a Table panel.
 */
export function createInitialTableOptions(): TableOptions {
  return {
    density: 'standard',
  };
}
