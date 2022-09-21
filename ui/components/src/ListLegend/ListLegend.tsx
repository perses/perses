import { List } from '@mui/material';
import { ListLegendItem } from './ListLegendItem';

interface ListLegendProps {
  height: number;
  width: number;
  items: ListLegendItem[];
}

export function ListLegend({ items, height, width }: ListLegendProps) {
  return (
    <List
      sx={{
        height: height,
        width: width,
        overflow: 'auto',
      }}
    >
      {items.map((item) => (
        <ListLegendItem item={item} />
      ))}
    </List>
  );
}
