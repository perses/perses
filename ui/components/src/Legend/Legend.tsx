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
import { LegendOptions, LegendItem } from '../model';
import { ListLegend, ListLegendProps } from './ListLegend';
import { CompactLegend } from './CompactLegend';

export interface LegendProps {
  width: number;
  height: number;
  data: LegendItem[];
  options: LegendOptions;

  /**
   * Additional props that will be passed to the list variation of the legend
   * that is used when:
   * - The legend is positioned on the right.
   * - The legend has a large number of items to display and requires virtualization
   *   to render performantly.
   */
  listProps?: Pick<ListLegendProps, 'initialRowHeight'>;
}

// When the number of items to display is above this number, it is likely to
// cause performance issues in the browser. The legend will be displayed in a
// format (list) that allows for virtualization to minimize the performance impact.
// Set this number based on testing, but it may need to be tuned a bit on the
// future as people test this out on different machines.
const NEED_VIRTUALIZATION_LIMIT = 500;

export function Legend({ width, height, options, data, listProps }: LegendProps) {
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
        <ListLegend items={data} width={width} height={height} {...listProps} />
      </Box>
    );
  }

  // The bottom legend is displayed as a list when the number of items is too
  // large and requires virtualization. Otherwise, it is rendered more compactly.
  // We do not need this check for the right-side legend because it is always
  // a virtualized list.
  const needsVirtualization = data.length >= NEED_VIRTUALIZATION_LIMIT;
  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'absolute',
        bottom: 0,
      }}
    >
      {needsVirtualization ? (
        <ListLegend items={data} width={width} height={height} {...listProps} />
      ) : (
        <CompactLegend items={data} height={height} />
      )}
    </Box>
  );
}
