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

import { Box } from '@mui/material';
import { ReactNode } from 'react';
import { LegendOptions, LegendItem, getLegendMode } from '../model';
import { ListLegend } from './ListLegend';
import { CompactLegend } from './CompactLegend';
import { TableLegend, TableLegendProps } from './TableLegend';

export interface LegendProps {
  width: number;
  height: number;
  data: LegendItem[];
  options: LegendOptions;

  /**
   * Additional props that will be passed to the table variation of the legend
   * that is used when `options.mode` is set to `table`.
   */
  tableProps?: Pick<TableLegendProps, 'onRowSelectionChange'>;
}

// When the number of items to display is above this number, it is likely to
// cause performance issues in the browser. The legend will be displayed in a
// format (list) that allows for virtualization to minimize the performance impact.
// Set this number based on testing, but it may need to be tuned a bit on the
// future as people test this out on different machines.
const NEED_VIRTUALIZATION_LIMIT = 500;

export function Legend({ width, height, options, data, listProps, tableProps }: LegendProps) {
  const mode = getLegendMode(options.mode);

  // The bottom legend is displayed as a list when the number of items is too
  // large and requires virtualization. Otherwise, it is rendered more compactly.
  // We do not need this check for the right-side legend because it is always
  // a virtualized list.
  const needsVirtualization = data.length >= NEED_VIRTUALIZATION_LIMIT;

  let legendContent: ReactNode;
  if (mode === 'Table') {
    legendContent = <TableLegend {...tableProps} width={width} height={height} items={data} />;
  } else if (options.position === 'Right' || needsVirtualization) {
    legendContent = <ListLegend items={data} width={width} height={height} {...listProps} />;
  } else {
    legendContent = <CompactLegend items={data} height={height} />;
  }

  if (options.position === 'Right') {
    return (
      <Box
        sx={{
          width: width,
          height: height,
          position: 'absolute',
          top: 0,
          right: 0,
        }}
      >
        {legendContent}
      </Box>
    );
  }

  // Bottom position
  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'absolute',
        bottom: 0,
      }}
    >
      {legendContent}
    </Box>
  );
}
