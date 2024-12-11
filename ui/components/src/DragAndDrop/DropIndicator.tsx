// Copyright 2024 The Perses Authors
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

import { Box, Stack } from '@mui/material';
import { ReactElement } from 'react';

export function DropIndicator(): ReactElement {
  return (
    <Stack direction="row" alignItems="center">
      <Box
        sx={{
          content: '""',
          width: 8,
          height: 8,
          boxSizing: 'border-box',
          position: 'absolute',
          backgroundColor: (theme) => theme.palette.background.default,
          border: (theme) => `2px solid ${theme.palette.info.main}`,
          borderRadius: '50%',
        }}
      ></Box>
      <Box
        sx={{
          content: '""',
          height: 2,
          background: (theme) => theme.palette.info.main,
          width: '100%',
        }}
      ></Box>
    </Stack>
  );
}
