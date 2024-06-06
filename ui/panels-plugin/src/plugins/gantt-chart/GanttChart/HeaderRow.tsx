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

import { Box, Stack, useTheme } from '@mui/material';
import { rowHeight } from './utils';
import { TicksHeader } from './Ticks';
import { Span, Viewport } from './model';

interface HeaderRowProps {
  rootSpan: Span;
  viewport: Viewport;
}

export function HeaderRow(props: HeaderRowProps) {
  const { rootSpan, viewport } = props;
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      style={{
        height: rowHeight,
        backgroundColor: theme.palette.grey.A100,
        fontSize: '0.9rem',
      }}
    >
      <Box style={{ width: '25%' }}>
        <span style={{ padding: '.25rem' }}>Service & Operation</span>
      </Box>
      <Box style={{ position: 'relative', height: '100%', flexGrow: 1 }}>
        <TicksHeader rootSpan={rootSpan} viewport={viewport} />
      </Box>
    </Stack>
  );
}
