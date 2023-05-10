import {
  TableContainer as MuiTableContainer,
  styled,
  TableContainerProps as MuiTableContainerProps,
} from '@mui/material';
import { forwardRef } from 'react';

const StyledMuiTablContainer = styled(MuiTableContainer)(({ theme }) => ({}));

type VirtualizedTableContainerProps = MuiTableContainerProps;

// TODO: check on type for tbody
export const VirtualizedTableContainer = forwardRef<HTMLDivElement, VirtualizedTableContainerProps>(
  function VirtualizedTableContainer(props, ref) {
    return <StyledMuiTablContainer {...props} ref={ref} />;
  }
);
