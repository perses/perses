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

import { Box, Typography } from '@mui/material';

interface YAxisLabelProps {
  name: string;
  height: number;
}

export function YAxisLabel({ name, height }: YAxisLabelProps) {
  return (
    <Box
      sx={{
        display: 'inline-block',
        maxWidth: height, // allows rotated text to truncate instead of causing overlap
        position: 'absolute',
        top: '45%',
        transform: 'translateX(-50%) rotate(-90deg)',
        transformOrigin: 'top',
        textAlign: 'center',
        zIndex: 1,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}
