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
import { ListLegend } from './ListLegend';
import { CompactLegend } from './CompactLegend';

export interface LegendProps {
  width: number;
  height: number;
  data: LegendItem[];
  options: LegendOptions;
}

export function Legend({ width, height, options, data }: LegendProps) {
  console.log(JSON.stringify(options));
  console.log(JSON.stringify(data));

  if (options.position === 'Right') {
    return (
      <Box
        sx={{
          width: width,
          height: '100%',
          position: 'absolute',
          top: 0,
          right: 0,
          overflowX: 'hidden',
          overflowY: 'scroll',
        }}
      >
        <ListLegend items={data} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: width,
        height: height,
        position: 'absolute',
        bottom: 0,
      }}
    >
      <CompactLegend items={data} height={height} />
    </Box>
  );
}
