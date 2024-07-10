export interface ColumnOptions {
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
  /**
   * Width of the column when rendered in a table. It should be a number in pixels
   * or "auto" to allow the table to automatically adjust the width to fill
   * space.
   */
  width?: number | 'auto';
  // When `true`, the column will not be displayed.
  hide?: boolean;
}
