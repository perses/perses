// Copyright 2022 The Perses Authors
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

import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { combineSx } from '../utils';

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
