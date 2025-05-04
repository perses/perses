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
import {
  AccessorKeyColumnDef,
  CellContext,
  ColumnDef,
  CoreOptions,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import { CSSProperties } from 'react';

export const DEFAULT_COLUMN_WIDTH = 150;
export const DEFAULT_COLUMN_HEIGHT = 40;

export type TableDensity = 'compact' | 'standard' | 'comfortable';
export type SortDirection = 'asc' | 'desc' | undefined;

export type TableRowEventOpts = {
  /**
   * Unique identifier for the row.
   */
  id: string;

  /**
   * Index of the row in the original data.
   */
  index: number;
};

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
   * Custom render cell configurations. Each entry of the object should be an
   * id for cell `${rowIndex}_${columnIndex}`, can apply custom text, text color
   * and background color.
   */
  cellConfigs?: TableCellConfigs;

  /**
   * The density of the table layout. This impacts the size and space taken up
   * by content in the table (e.g. font size, padding).
   */
  density?: TableDensity;

  /**
   *  When using "auto", the table will try to automatically adjust the width of columns to fit without overflowing.
   *  If there is not enough width for each column, the display can unreadable.
   */
  defaultColumnWidth?: 'auto' | number;

  /**
   *  When using "auto", the table will calculate the cell height based on the line height of the theme and the density setting of the table.
   */
  defaultColumnHeight?: 'auto' | number;

  /**
   * When `true`, the first column of the table will include checkboxes.
   */
  checkboxSelection?: boolean;

  /**
   * Determines the behavior of row selection.
   *
   * - `standard`: clicking a checkbox will toggle that rows's selected/unselected
   *    state and will not impact other rows.
   * - `legend`: clicking a checkbox will "focus" that row by selecting it and
   *    unselecting other rows. Clicking a checkbox with a modifier key pressed,
   *    will change this behavior to behave like `standard`.
   *
   * @default 'standard'
   */
  rowSelectionVariant?: 'standard' | 'legend';

  /**
   * State of selected rows in the table when `checkboxSelection` is enabled.
   *
   * Selected row state is a controlled value that should be managed using a
   * combination of this prop and `onRowSelectionChange`.
   */
  rowSelection?: RowSelectionState;

  /**
   * Callback fired when the mouse is moved over a table row.
   */
  onRowMouseOver?: (e: React.MouseEvent, opts: TableRowEventOpts) => void;

  /**
   * Callback fired when the mouse is moved out of a table row.
   */
  onRowMouseOut?: (e: React.MouseEvent, opts: TableRowEventOpts) => void;

  /**
   * State of the column sorting in the table.
   *
   * The column sorting is a controlled value that should be managed using a
   * combination fo this prop and `onSortingChange`.
   */
  sorting?: SortingState;

  /**
   * Callback fired when the selected rows in the table changes.
   */
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;

  /**
   * Callback fired when the table sorting changes.
   */
  onSortingChange?: (sorting: SortingState) => void;

  /**
   * State of the pagination in the table.
   * Default: undefined, i.e. pagination is disabled.
   */
  pagination?: PaginationState;

  /**
   * Callback fired when the table pagination changes.
   */
  onPaginationChange?: (pagination: PaginationState) => void;

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
  const lineHeightNum = typeof lineHeight === 'string' ? parseInt(lineHeight, 10) : (lineHeight ?? 0);
  const verticalPaddingNum = typeof paddingY === 'string' ? parseInt(paddingY, 10) : paddingY;

  return lineHeightNum + verticalPaddingNum * 2;
}

type TableCellLayout = NonNullable<Pick<React.CSSProperties, 'padding' | 'fontSize' | 'lineHeight'>> & {
  height: number;
};

type GetTableCellLayoutOpts = {
  isHeader?: boolean;
  isLastColumn?: boolean;
  isFirstColumn?: boolean;
  defaultColumnHeight?: 'auto' | number;
};

/**
 * Returns the properties to lay out the content of table cells based on the
 * theme and density.
 */
export function getTableCellLayout(
  theme: Theme,
  density: TableDensity,
  { isHeader, isLastColumn, isFirstColumn, defaultColumnHeight }: GetTableCellLayoutOpts = {}
): TableCellLayout {
  // Density Standard
  let paddingY = theme.spacing(1);
  let basePaddingX = theme.spacing(1.25);
  let edgePaddingX = theme.spacing(2);
  let paddingLeft = isFirstColumn ? edgePaddingX : basePaddingX;
  let paddingRight = isLastColumn ? edgePaddingX : basePaddingX;
  let lineHeight = theme.typography.body1.lineHeight;
  let fontSize = theme.typography.body1.fontSize;

  if (density === 'compact') {
    paddingY = theme.spacing(0.5);
    basePaddingX = theme.spacing(0.5);
    edgePaddingX = theme.spacing(1);
    paddingLeft = isFirstColumn ? edgePaddingX : basePaddingX;
    paddingRight = isLastColumn ? edgePaddingX : basePaddingX;
    lineHeight = theme.typography.body2.lineHeight;
    fontSize = theme.typography.body2.fontSize;
  }

  if (density === 'comfortable') {
    paddingY = theme.spacing(2);
    basePaddingX = theme.spacing(1.5);
    edgePaddingX = theme.spacing(2);
    paddingLeft = isFirstColumn ? edgePaddingX : basePaddingX;
    paddingRight = isLastColumn ? edgePaddingX : basePaddingX;
    lineHeight = theme.typography.body1.lineHeight;
    fontSize = theme.typography.body1.fontSize;
  }

  const height =
    isHeader || !defaultColumnHeight || defaultColumnHeight === 'auto'
      ? calculateTableCellHeight(lineHeight, paddingY)
      : defaultColumnHeight;

  return {
    padding: `${paddingY} ${paddingRight} ${paddingY} ${paddingLeft}`,
    height: height,
    fontSize: fontSize,
    lineHeight: lineHeight,
  };
}

export type TableCellAlignment = 'left' | 'right' | 'center';

export interface TableCellConfigs {
  [id: string]: TableCellConfig;
}

export interface TableCellConfig {
  text?: string;
  textColor?: string;
  backgroundColor?: string;
}

// Overrides of meta value, so it can have a meaningful type in our code instead
// of `any`. Putting this in the model instead of a separate .d.ts file because
// I couldn't get it to work properly that way and punted on figuring it out
// after trying several things.
declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: TableColumnConfig<TData>['align'];
    headerDescription?: TableColumnConfig<TData>['headerDescription'];
    cellDescription?: TableColumnConfig<TData>['cellDescription'];
    linkConfig?: TableColumnConfig<TData>['linkConfig'];
  }
}

interface LinkConfig {
  /**
   * A template string used to generate a URL for the column's cell values.
   * The template can include placeholders that will be replaced with the
   * corresponding cell data. For example, `{__value.text}` in the template will be
   * replaced with the value of the current cell.
   */
  urlTemplate?: string;

  /**
   * When set to `true`, the generated URL (from `urlTemplate`) will open in a
   * new browser tab. If `false` or undefined, the URL will open in
   * the same tab.
   * @default false
   */
  openInNewTab?: boolean;
}

// Only exposing a very simplified version of the very extensive column definitions
// possible with tanstack table to make it easier for us to control rendering
// and functionality.
export interface TableColumnConfig<TableData>
  // Any needed to work around some typing issues with tanstack query.
  // https://github.com/TanStack/table/issues/4241
  // TODO: revisit issue thread and see if there are any workarounds we can
  // use.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends Pick<AccessorKeyColumnDef<TableData, any>, 'accessorKey' | 'cell' | 'sortingFn'> {
  /**
   * Text to display in the header for the column.
   */
  header: string;

  /**
   * Alignment of the content in the cell.
   */
  align?: TableCellAlignment;

  /**
   * Text to display when hovering over a cell. This can be useful for
   * providing additional information about the column when the content is
   * ellipsized to fit in the space.
   *
   * If set to `true`, it will use the value generated by the `cell` prop if it
   * can be treated as a string.
   */
  // `any` needed for same reason as no-explicit-any higher up in this type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellDescription?: ((props: CellContext<TableData, any>) => string) | boolean | undefined;

  /**
   * When `true`, the column will be sortable.
   * @default false
   */
  enableSorting?: boolean;

  /**
   * Text to display when hovering over the header text. This can be useful for
   * providing additional information about the column when you want to keep the
   * header text relatively short to manage the column width.
   */
  headerDescription?: string;

  // Tanstack Table does not support an "auto" value to naturally size to fit
  // the space in a table. Adding a custom setting to manage this ourselves.
  /**
   * Width of the column when rendered in a table. It should be a number in pixels
   * or "auto" to allow the table to automatically adjust the width to fill
   * space.
   * @default 'auto'
   */
  width?: number | 'auto';

  /**
   * Configuration for turning cell values into clickable links.
   * Use URL templates with placeholders to create dynamic links based on cell data.
   */
  linkConfig?: LinkConfig;
}

/**
 * Takes in a perses table column and transforms it into a tanstack column.
 */
export function persesColumnsToTanstackColumns<TableData>(
  columns: Array<TableColumnConfig<TableData>>
): Array<ColumnDef<TableData>> {
  const tableCols: Array<ColumnDef<TableData>> = columns.map(
    ({ width, align, headerDescription, cellDescription, enableSorting, linkConfig, ...otherProps }) => {
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

        // Default sorting to false, so it is very explicitly set per column.
        enableSorting: !!enableSorting,

        // Open-ended store for extra metadata in TanStack Table, so you can bake
        // in your own features.
        meta: {
          align,
          headerDescription,
          cellDescription,
          linkConfig,
        },
      };

      return result;
    }
  );

  return tableCols;
}
