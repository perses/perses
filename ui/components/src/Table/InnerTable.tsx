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

import { Table as MuiTable, styled, TableProps as MuiTableProps } from '@mui/material';
import { forwardRef } from 'react';
import { TableDensity } from './model/table-model';

const StyledMuiTable = styled(MuiTable)(({ theme }) => ({
  // This value is needed to have a consistent table layout when scrolling.
  tableLayout: 'fixed',
  borderCollapse: 'separate',
  backgroundColor: theme.palette.background.default,
}));

type InnerTableProps = Omit<MuiTableProps, 'size'> & {
  density: TableDensity;
};

const TABLE_DENSITY_CONFIG: Record<TableDensity, MuiTableProps['size']> = {
  compact: 'small',
  standard: 'medium',
};

export const InnerTable = forwardRef<HTMLTableElement, InnerTableProps>(function InnerTable(
  { density, width, ...otherProps },
  ref
) {
  return (
    <StyledMuiTable
      {...otherProps}
      tabIndex={-1}
      size={TABLE_DENSITY_CONFIG[density]}
      ref={ref}
      sx={{
        width: width,
      }}
    />
  );
});
