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
import { ReactElement } from 'react';
import { Viewport, rowHeight } from '../utils';
import { TicksHeader } from '../Ticks';
import { GanttTrace } from '../trace';

interface GanttTableHeaderProps {
  trace: GanttTrace;
  viewport: Viewport;
  nameColumnWidth: number;
  divider: React.ReactNode;
}

export function GanttTableHeader(props: GanttTableHeaderProps): ReactElement {
  const { trace, viewport, nameColumnWidth, divider } = props;
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        height: rowHeight,
        fontSize: '0.9rem',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box style={{ width: `${nameColumnWidth * 100}%` }}>
        <span style={{ padding: '.25rem' }}>Service & Operation</span>
      </Box>
      {divider}
      <Box sx={{ position: 'relative', height: '100%', flexGrow: 1 }}>
        <TicksHeader trace={trace} viewport={viewport} />
      </Box>
    </Stack>
  );
}
