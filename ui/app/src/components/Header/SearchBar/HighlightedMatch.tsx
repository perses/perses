// Copyright The Perses Authors
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

import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import type { MatchingInterval } from '@nexucis/kvsearch';
import type { ReactElement, ReactNode } from 'react';

interface HighlightedMatchProps {
  value: string;
  sx: SxProps<Theme> | undefined;
  dataTestId?: string;
  intervals: MatchingInterval[];
}

const STRONG_SX = {
  color: 'warning.main',
};

export const HighlightedMatch = ({ value, sx, dataTestId, intervals }: HighlightedMatchProps): ReactElement => {
  const result: ReactNode[] = [];
  let lastIndex = 0;
  for (const { from, to } of intervals) {
    result.push(value.slice(lastIndex, from));
    result.push(
      <Box component="strong" sx={STRONG_SX} key={from}>
        {value.slice(from, to + 1)}
      </Box>,
    );
    lastIndex = to + 1;
  }
  result.push(value.slice(lastIndex));
  return (
    <Typography data-testid={dataTestId} sx={sx}>
      {result}
    </Typography>
  );
};
