import { Theme } from '@mui/material';
import { CSSProperties } from 'react';

export type TableDensity = 'compact' | 'standard';

function calculateTableCellHeight(lineHeight: CSSProperties['lineHeight'], paddingY: string): number {
  // Doing a bunch of math to enforce height to avoid weirdness with mismatched
  // heights based on customization of cell contents.
  const lineHeightNum = typeof lineHeight === 'string' ? parseInt(lineHeight, 10) : lineHeight ?? 0;
  const verticalPaddingNum = typeof paddingY === 'string' ? parseInt(paddingY, 10) : paddingY;

  return lineHeightNum + verticalPaddingNum * 2;
}

type TableCellLayout = Pick<React.CSSProperties, 'padding' | 'fontSize' | 'lineHeight'> & {
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
