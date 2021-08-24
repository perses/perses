import { Grid, GridProps, GridSize } from '@material-ui/core';
import {
  GridCellDefinition,
  GridLayoutDefinition,
  GridRowDefinition,
} from '@perses-ui/core';
import AlertErrorBoundary from './AlertErrorBoundary';
import ContentRefResolver from './ContentRefResolver';

const GRID_SPACING = 1;

export interface GridLayoutProps extends GridProps {
  definition: GridLayoutDefinition;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
function GridLayout(props: GridLayoutProps) {
  const { definition, ...others } = props;

  return (
    <Grid container spacing={GRID_SPACING} {...others}>
      {definition.options.children.map((gridRow, idx) => (
        <GridRow key={idx} definition={gridRow} />
      ))}
    </Grid>
  );
}

export default GridLayout;

interface GridRowProps {
  definition: GridRowDefinition;
}

/**
 * A row in a GridLayout.
 */
function GridRow(props: GridRowProps) {
  const { definition } = props;

  // Count the overall number of columns in the row as we create the cells
  let columns = 0;
  const cells: React.ReactNode[] = [];
  definition.forEach((cell, idx) => {
    columns += cell.width;
    cells.push(<GridCell key={idx} definition={cell} />);
  });

  return (
    <Grid item container columns={columns} spacing={GRID_SPACING}>
      {cells}
    </Grid>
  );
}

interface GridCellProps extends Omit<GridProps, 'children'> {
  definition: GridCellDefinition;
}

/**
 * An individual cell in a GridRow that renders a ContentRefResolver for
 * resolving the cell's contents.
 */
function GridCell(props: GridCellProps) {
  const { definition, ...others } = props;
  let content: React.ReactNode;
  if (definition.content === undefined) {
    content = null;
  } else {
    content = <ContentRefResolver contentRef={definition.content} />;
  }

  return (
    <Grid item xs={12} md={definition.width as GridSize} {...others}>
      <AlertErrorBoundary>{content}</AlertErrorBoundary>
    </Grid>
  );
}
