// Copyright 2023 The Perses Authors
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

import { Theme } from '@mui/material';
import { AccessorKeyColumnDef, ColumnDef, CoreOptions, RowSelectionState } from '@tanstack/react-table';
import { CSSProperties } from 'react';

export type TableDensity = 'compact' | 'standard';

export interface TableProps<TableData> {
  /**
   * Height of the table.
   */
  height: number;

  /**
   * Width of the table.
   */
  width: number;

  /**
   * Array of data to render in the table. Each entry in the array will be
   * rendered as a row in the table.
   */
  data: TableData[];

  /**
   * Array of column configuration for the table. Each entry in the array will
   * be rendered as a column header and impact the rendering of cells within
   * table rows.
   */
  columns: Array<TableColumnConfig<TableData>>;

  /**
   * The density of the table layout. This impacts the size and space taken up
   * by content in the table (e.g. font size, padding).
   */
  density?: TableDensity;

  /**
   * When `true`, the first column of the table will include checkboxes.
   */
  checkboxSelection?: boolean;

  /**
   * State of selected rows in the table when `checkboxSelection` is enabled.
   *
   * Selected row state is a controlled value that should be managed using a
   * combination of this prop and `onRowSelectionChange`.
   */
  rowSelection?: RowSelectionState;

  /**
   * Callback fired when the selected rows in the table changes.
   */
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;

  /**
   * Function used to determine the unique identifier used for each row. This
   * value is used to key `rowSelection`. If this value is not set, the index
   * is used as the unique identifier.
   */
  getRowId?: CoreOptions<TableData>['getRowId'];

  /**
   * Function used to determine the color of the checkbox when `checkboxSelection`
   * is enabled. If not set, a default color is used.
   */
  getCheckboxColor?: (rowData: TableData) => string;
}

function calculateTableCellHeight(lineHeight: CSSProperties['lineHeight'], paddingY: string): number {
  // Doing a bunch of math to enforce height to avoid weirdness with mismatched
  // heights based on customization of cell contents.
  const lineHeightNum = typeof lineHeight === 'string' ? parseInt(lineHeight, 10) : lineHeight ?? 0;
  const verticalPaddingNum = typeof paddingY === 'string' ? parseInt(paddingY, 10) : paddingY;

  return lineHeightNum + verticalPaddingNum * 2;
}

type TableCellLayout = NonNullable<Pick<React.CSSProperties, 'padding' | 'fontSize' | 'lineHeight'>> & {
  height: number;
};

/**
 * Returns the properties to lay out the content of table cells based on the
 * theme and density.
 */
export function getTableCellLayout(theme: Theme, density: TableDensity): TableCellLayout {
  if (density === 'compact') {
    const paddingY = theme.spacing(0.5);
    const paddingX = theme.spacing(0.25);
    const lineHeight = theme.typography.body2.lineHeight;

    return {
      padding: `${paddingY} ${paddingX}`,
      height: calculateTableCellHeight(lineHeight, paddingY),
      fontSize: theme.typography.body2.fontSize,
      lineHeight: lineHeight,
    };
  }

  // standard density
  const paddingY = theme.spacing(1);
  const paddingX = theme.spacing(1.25);
  const lineHeight = theme.typography.body1.lineHeight;

  return {
    padding: `${paddingY} ${paddingX}`,
    height: calculateTableCellHeight(lineHeight, paddingY),
    fontSize: theme.typography.body1.fontSize,
    lineHeight: lineHeight,
  };
}

// Only exposing a very simplified version of the very extensive column definitions
// possible with tanstack table to make it easier for us to control rendering
// and functionality.
export interface TableColumnConfig<TableData>
  // Any needed to work around some typing issues with tanstack query.
  // https://github.com/TanStack/table/issues/4241
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends Pick<AccessorKeyColumnDef<TableData, any>, 'accessorKey' | 'cell'> {
  /**
   * Text to display in the header for the column.
   */
  header: string;

  // Tanstack Table does not support an "auto" value to naturally size to fit
  // the space in a table. Adding a custom setting to manage this ourselves.
  /**
   * Width of the column when rendered in a table. It should be a number in pixels
   * or "auto" to allow the table to automatically adjust the width to fill
   * space.
   * @default 'auto'
   */
  width?: number | 'auto';
}

/**
 * Takes in a perses table column and transforms it into a tanstack column.
 */
export function persesColumnsToTanstackColumns<TableData>(columns: Array<TableColumnConfig<TableData>>) {
  const tableCols: Array<ColumnDef<TableData>> = columns.map(({ width, ...otherProps }) => {
    // Tanstack Table does not support an "auto" value to naturally size to fit
    // the space in a table. We translate our custom "auto" setting to 0 size
    // for these columns, so it is easy to fall back to auto when rendering.
    // Taking from a recommendation in this github discussion:
    // https://github.com/TanStack/table/discussions/4179#discussioncomment-3631326
    const sizeProps =
      width === 'auto' || width === undefined
        ? {
            // All zero values are used as shorthand for "auto" when rendering
            // because it makes it easy to fall back. (e.g. `row.size || "auto"`)
            size: 0,
            minSize: 0,
            maxSize: 0,
          }
        : {
            size: width,
          };

    const result = {
      ...otherProps,
      ...sizeProps,
    };

    return result;
  });

  return tableCols;
}
