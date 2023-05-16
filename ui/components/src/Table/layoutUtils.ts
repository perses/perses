import { Theme } from '@mui/material';

export type TableDensity = 'compact' | 'standard';

/**
 * Returns the properties to lay out the content of table cells based on the
 * theme and density.
 */
export function getCellLayoutProps(theme: Theme, density: TableDensity): React.CSSProperties | undefined {
  if (density === 'compact') {
    const paddingY = theme.spacing(0.5);
    const paddingX = theme.spacing(0.25);
    const lineHeight = theme.typography.body2.lineHeight;
    const lineHeightNum = typeof lineHeight === 'string' ? parseInt(lineHeight, 10) : lineHeight ?? 0;
    const verticalPaddingNum = typeof paddingY === 'string' ? parseInt(paddingY, 10) : paddingY;

    // Doing a bunch of math to enforce height to avoid weirdness with mismatched
    // heights based on customization of cell contents.
    const height = lineHeightNum + verticalPaddingNum * 2;

    return {
      padding: `${paddingY} ${paddingX}`,
      height: height,
      fontSize: theme.typography.body2.fontSize,
      lineHeight: lineHeight,
    };
  }
}
