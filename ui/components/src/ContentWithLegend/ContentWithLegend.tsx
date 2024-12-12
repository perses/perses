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

import { ReactElement } from 'react';
import { Box, useTheme } from '@mui/material';
import { getLegendSize } from '@perses-dev/core';
import { Legend } from '../Legend';
import { ContentWithLegendProps, getContentWithLegendLayout } from './model/content-with-legend-model';

/**
 * Component to help lay out content alongside a `Legend` component based on the
 * configuration of the legend.
 *
 * See the documentation for the `Legend` component for more details about the
 * features and configuration of the legend.
 */
export function ContentWithLegend({
  children,
  legendProps,
  width,
  height,
  spacing = 0,
  legendSize,
  minChildrenWidth = 100,
  minChildrenHeight = 100,
}: ContentWithLegendProps): ReactElement {
  const theme = useTheme();
  const { content, legend, margin } = getContentWithLegendLayout({
    width,
    height,
    legendProps,
    minChildrenHeight,
    minChildrenWidth,
    spacing,
    theme,
    legendSize: getLegendSize(legendSize),
  });

  return (
    <Box
      style={{
        width,
        height,
      }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          width: content.width,
          height: content.height,
        }}
        sx={{
          marginRight: `${margin.right}px`,
          marginBottom: `${margin.bottom}px`,
          overflow: 'hidden',
        }}
      >
        {typeof children === 'function' ? children({ width: content.width, height: content.height }) : children}
      </Box>
      {legendProps && legend.show && <Legend {...legendProps} height={legend.height} width={legend.width} />}
    </Box>
  );
}
