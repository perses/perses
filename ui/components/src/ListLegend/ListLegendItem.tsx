import React from 'react';
import { Box, ListItemText, ListItem, BoxProps } from '@mui/material';
import { combineSx } from '../utils';
interface ListLegendItemProps {
  item: ListLegendItem;
}

export interface ListLegendItem {
  id: string;
  label: string;
  isSelected: boolean;
  color: string;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
}

export const ListLegendItem = React.memo(function ListLegendItem({ item }: ListLegendItemProps) {
  return (
    <ListItem
      dense={true}
      sx={{
        display: 'flex',
        paddingTop: 0,
        paddingBottom: 0,
        cursor: 'pointer',
      }}
      key={item.id}
      onClick={item.onClick}
      selected={item.isSelected}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <LegendColorBadge color={item.color} />
      </Box>
      <ListItemText primary={item.label}></ListItemText>
    </ListItem>
  );
});

export interface LegendColorBadgeProps extends BoxProps<'div'> {
  color: string;
}

export const LegendColorBadge = React.memo(function LegendColorBadge({ color, sx, ...others }: LegendColorBadgeProps) {
  return (
    <Box
      {...others}
      sx={combineSx(
        {
          height: 4,
          width: 16,
          margin: (theme) => theme.spacing(0.5),
        },
        sx
      )}
      style={{ ...others.style, backgroundColor: color }}
    />
  );
});
