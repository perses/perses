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

import { Box, useTheme } from '@mui/material';
import { ReactElement } from 'react';
import { TicksHeader } from '../Ticks';
import { Viewport, rowHeight } from '../utils';
import { TracingGanttChartOptions } from '../../gantt-chart-model';
import { GanttTrace } from '../trace';
import { Canvas } from './Canvas';

interface MiniGanttChartProps {
  options: TracingGanttChartOptions;
  trace: GanttTrace;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

export function MiniGanttChart(props: MiniGanttChartProps): ReactElement {
  const { options, trace, viewport, setViewport } = props;
  const theme = useTheme();

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${theme.shape.borderRadius}px`,
      }}
    >
      <Box sx={{ position: 'relative', height: rowHeight, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <TicksHeader
          trace={trace}
          viewport={{ startTimeUnixMs: trace.startTimeUnixMs, endTimeUnixMs: trace.endTimeUnixMs }}
        />
      </Box>
      <Canvas options={options} trace={trace} viewport={viewport} setViewport={setViewport} />
    </Box>
  );
}
