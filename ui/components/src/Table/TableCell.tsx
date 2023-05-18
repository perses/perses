import {
  TableCell as MuiTableCell,
  styled,
  TableCellProps as MuiTableCellProps,
  Box,
  useTheme,
  Theme,
} from '@mui/material';
import { CSSProperties, forwardRef, useEffect, useRef } from 'react';
import { combineSx } from '../utils';
import { TableDensity } from './table-model';

const StyledMuiTableCell = styled(MuiTableCell)(({ theme, variant }) => ({
  padding: 0,
  backgroundColor: 'inherit',

  '&.MuiTableCell-head': {
    // Important to avoid scrolling behind the header showing through.
    backgroundColor: theme.palette.background.paper,
  },
  '&:focus-visible': {
    outline: `solid 1px ${theme.palette.primary.main}`,
    // Move inward a little to avoid getting cut off when focusing on items
    // at the edge of the table.
    outlineOffset: '-1px',
    borderRadius: 0,
  },
}));

export interface TableCellProps extends Omit<MuiTableCellProps, 'tabIndex'> {
  density: TableDensity;
  isActive?: boolean;
}

function calculateCellHeight(lineHeight: CSSProperties['lineHeight'], paddingY: string) {
  // Doing a bunch of math to enforce height to avoid weirdness with mismatched
  // heights based on customization of cell contents.
  const lineHeightNum = typeof lineHeight === 'string' ? parseInt(lineHeight, 10) : lineHeight ?? 0;
  const verticalPaddingNum = typeof paddingY === 'string' ? parseInt(paddingY, 10) : paddingY;

  return lineHeightNum + verticalPaddingNum * 2;
}

/**
 * Returns the properties to lay out the content of table cells based on the
 * theme and density.
 */
function getCellLayoutProps(theme: Theme, density: TableDensity): React.CSSProperties | undefined {
  if (density === 'compact') {
    const paddingY = theme.spacing(0.5);
    const paddingX = theme.spacing(0.25);
    const lineHeight = theme.typography.body2.lineHeight;

    return {
      padding: `${paddingY} ${paddingX}`,
      height: calculateCellHeight(lineHeight, paddingY),
      fontSize: theme.typography.body2.fontSize,
      lineHeight: lineHeight,
    };
  }

  const paddingY = theme.spacing(1);
  const paddingX = theme.spacing(1.25);
  const lineHeight = theme.typography.body1.lineHeight;

  return {
    padding: `${paddingY} ${paddingX}`,
    height: calculateCellHeight(lineHeight, paddingY),
    fontSize: theme.typography.body1.fontSize,
    lineHeight: lineHeight,
  };
}

export function TableCell({ children, density, variant, width, isActive, ...otherProps }: TableCellProps) {
  const theme = useTheme();

  const elRef = useRef<HTMLTableCellElement>();

  const isHeader = variant === 'head';
  const isCompact = density === 'compact';

  useEffect(() => {
    if (isActive) {
      console.log(`isActive: ${isActive}`);
      console.log(elRef.current);
    }
    if (isActive && elRef.current) {
      elRef.current.focus();
    }
  }, [isActive]);

  return (
    <StyledMuiTableCell
      {...otherProps}
      tabIndex={isActive ? 0 : -1}
      sx={{
        width: width,
        borderBottom: isHeader || !isCompact ? (theme) => `solid 1px ${theme.palette.divider}` : 'none',
      }}
      ref={elRef}
    >
      <Box
        sx={{
          ...getCellLayoutProps(theme, density),
          position: 'relative',

          // Text truncation. Currently enforced on all cells. We may control
          // this with a prop in the future.
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {children}
      </Box>
    </StyledMuiTableCell>
  );
}
