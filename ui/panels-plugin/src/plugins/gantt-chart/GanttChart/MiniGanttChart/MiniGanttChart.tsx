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
import { Span } from '@perses-dev/core';
import { TicksHeader } from '../Ticks';
import { Viewport, rowHeaderColor, rowHeight } from '../utils';
import { Canvas } from './Canvas';

interface MiniGanttChartProps {
  rootSpan: Span;
  viewport: Viewport;
  setViewport: (v: Viewport) => void;
}

export function MiniGanttChart(props: MiniGanttChartProps) {
  const { rootSpan, viewport, setViewport } = props;
  const theme = useTheme();

  return (
    <Box sx={{ marginBottom: 2, border: `1px solid ${rowHeaderColor(theme)}` }}>
      <Box sx={{ position: 'relative', height: rowHeight, backgroundColor: rowHeaderColor(theme) }}>
        <TicksHeader rootSpan={rootSpan} viewport={rootSpan} />
      </Box>
      <Canvas rootSpan={rootSpan} viewport={viewport} setViewport={setViewport} />
    </Box>
  );
}
